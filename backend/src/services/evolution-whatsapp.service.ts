import { z } from "zod";

import type {
  IntegrationSummary,
  WhatsAppConnectCode,
  WhatsAppConnectionStatus,
  WhatsAppDisconnectResult,
  WhatsAppInstanceCreateResult,
  WhatsAppTextMessageInput,
  WhatsAppTextMessageResult,
} from "../types/integration";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";

type FetchFn = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => Promise<Response>;

const sendTextSchema = z.object({
  number: z.string().min(10).max(30),
  text: z.string().min(1).max(4096),
});

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  return value === "true";
};

const parseInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const readConfig = () => ({
  enabled: parseBoolean(process.env.WHATSAPP_EVOLUTION_ENABLED, false),
  baseUrl: process.env.WHATSAPP_EVOLUTION_BASE_URL ?? "",
  authHeaderName: process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_NAME ?? env.WHATSAPP_EVOLUTION_AUTH_HEADER_NAME,
  authHeaderValue:
    process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE
    ?? process.env.WHATSAPP_EVOLUTION_API_KEY
    ?? env.WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE,
  instance: process.env.WHATSAPP_EVOLUTION_INSTANCE ?? "",
  timeoutMs: parseInteger(process.env.WHATSAPP_EVOLUTION_TIMEOUT_MS, 10_000),
});

export class EvolutionWhatsAppService {
  public constructor(
    private readonly fetchFn: FetchFn = (input, init) => fetch(input, init),
  ) {}

  public list(status?: string | null, phoneNumber?: string | null): { items: IntegrationSummary[] } {
    const config = readConfig();

    return {
      items: [
        {
          id: "whatsapp",
          provider: "evolution",
          enabled: config.enabled,
          ...(phoneNumber === undefined ? {} : { phoneNumber }),
          ...(status === undefined ? {} : { status }),
        },
      ],
    };
  }

  public async getStatus(instanceName: string): Promise<WhatsAppConnectionStatus> {
    const data = await this.request<{ instance: { instanceName: string; state: string } }>(
      `/instance/connectionState/${instanceName}`,
      {
        method: "GET",
      },
    );

    return {
      state: data.instance.state,
    };
  }

  public async connect(instanceName: string, number?: string): Promise<WhatsAppConnectCode> {
    const queryString = number ? `?number=${encodeURIComponent(number)}` : "";

    return this.request<WhatsAppConnectCode>(
      `/instance/connect/${instanceName}${queryString}`,
      {
        method: "GET",
      },
    );
  }

  public async createInstance(instanceName: string): Promise<WhatsAppInstanceCreateResult> {
    return this.request<WhatsAppInstanceCreateResult>(
      "/instance/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceName,
          integration: "WHATSAPP-BAILEYS",
          qrcode: false,
        }),
      },
    );
  }

  public async restartInstance(instanceName: string): Promise<void> {
    await this.request<Record<string, unknown>>(
      `/instance/restart/${instanceName}`,
      {
        method: "PUT",
      },
    );
  }

  public async logoutInstance(instanceName: string): Promise<WhatsAppDisconnectResult> {
    await this.request<Record<string, unknown>>(
      `/instance/logout/${instanceName}`,
      {
        method: "DELETE",
      },
    );

    return {
      state: "disconnected",
    };
  }

  public async sendText(instanceName: string, input: WhatsAppTextMessageInput): Promise<WhatsAppTextMessageResult> {
    const data = sendTextSchema.parse(input);

    return this.request<WhatsAppTextMessageResult>(
      `/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: data.number,
          text: data.text,
        }),
      },
    );
  }

  private ensureConfigured(): void {
    const config = readConfig();

    if (!config.enabled) {
      throw new AppError("whatsapp.disabled", "WhatsApp integration is disabled.", 503);
    }

    if (!config.baseUrl) {
      throw new AppError("whatsapp.not_configured", "WhatsApp integration is not configured.", 503);
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    this.ensureConfigured();
    const config = readConfig();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
      };

      if (config.authHeaderValue) {
        headers[config.authHeaderName] = config.authHeaderValue;
      }

      const response = await this.fetchFn(`${normalizeBaseUrl(config.baseUrl)}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      const responseText = await response.text();
      const payload = responseText ? (JSON.parse(responseText) as unknown) : {};

      if (!response.ok) {
        throw new AppError(
          "whatsapp.request_failed",
          `Evolution API request failed with status ${response.status}.`,
          response.status >= 400 && response.status < 500 ? 502 : 503,
        );
      }

      return payload as T;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("whatsapp.unavailable", "WhatsApp integration is unavailable.", 503);
    } finally {
      clearTimeout(timeout);
    }
  }
}
