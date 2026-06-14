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

type UnknownRecord = Record<string, unknown>;

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

const normalizePhoneNumber = (value: string): string => value.replace(/\D/g, "");

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findStringValue(value: unknown, keys: string[]): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const currentValue = value[key];
    if (typeof currentValue === "string" && currentValue.trim().length > 0) {
      return currentValue;
    }
  }

  for (const currentValue of Object.values(value)) {
    const nestedValue = findStringValue(currentValue, keys);
    if (nestedValue) {
      return nestedValue;
    }
  }

  return undefined;
}

function findNumberValue(value: unknown, keys: string[]): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const currentValue = value[key];
    if (typeof currentValue === "number" && Number.isFinite(currentValue)) {
      return currentValue;
    }
  }

  for (const currentValue of Object.values(value)) {
    const nestedValue = findNumberValue(currentValue, keys);
    if (nestedValue !== undefined) {
      return nestedValue;
    }
  }

  return undefined;
}

function normalizeConnectCode(payload: unknown): WhatsAppConnectCode {
  const pairingCode = findStringValue(payload, ["pairingCode", "pairing_code", "pairing"]);
  const code = findStringValue(payload, ["code"]);
  const qrCode = findStringValue(payload, ["qrCode", "qrcode", "qr", "base64"]);
  const count = findNumberValue(payload, ["count"]);

  return {
    ...(pairingCode === undefined ? {} : { pairingCode }),
    ...(code === undefined ? {} : { code }),
    ...(qrCode === undefined ? {} : { qrCode }),
    ...(count === undefined ? {} : { count }),
  };
}

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
    const data = await this.request<{ instance?: { instanceName: string; state?: string; status?: string } }>(
      `/instance/connectionState/${instanceName}`,
      {
        method: "GET",
      },
    );

    return {
      state: data.instance?.state ?? data.instance?.status ?? "disconnected",
    };
  }

  public async connect(instanceName: string, number?: string): Promise<WhatsAppConnectCode> {
    const normalizedNumber = number ? normalizePhoneNumber(number) : undefined;
    const postPayload = await this.tryConnectWithPost(instanceName, normalizedNumber);
    const postResult = normalizeConnectCode(postPayload);

    if (postResult.pairingCode || postResult.code) {
      return postResult;
    }

    const queryString = normalizedNumber ? `?number=${encodeURIComponent(normalizedNumber)}` : "";
    const getPayload = await this.request<unknown>(`/instance/connect/${instanceName}${queryString}`, {
      method: "GET",
    });

    return normalizeConnectCode(getPayload);
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
          qrcode: true,
          qrCode: true,
          pairingCode: true,
          rejectCall: true,
          msgCall: "",
          groupsIgnore: true,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        }),
      },
    );
  }

  public async setPairingCodeMode(instanceName: string): Promise<void> {
    await this.request<Record<string, unknown>>(
      `/settings/set/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrcode: true,
          qrCode: true,
          pairingCode: true,
          rejectCall: true,
          msgCall: "",
          groupsIgnore: true,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        }),
      },
    );
  }

  private async tryConnectWithPost(instanceName: string, number?: string): Promise<unknown> {
    try {
      return await this.request<unknown>(
        `/instance/connect/${instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(number ? { number } : {}),
        },
      );
    } catch (error: unknown) {
      if (error instanceof AppError && error.code === "whatsapp.request_failed") {
        return {};
      }

      throw error;
    }
  }

  public async restartInstance(instanceName: string): Promise<void> {
    await this.request<Record<string, unknown>>(
      `/instance/restart/${instanceName}`,
      {
        method: "POST",
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
