import { afterEach, describe, expect, it, vi } from "vitest";

import { EvolutionWhatsAppService } from "../../../src/services/evolution-whatsapp.service";
import { AppError } from "../../../src/utils/app-error";

const originalEnv = {
  enabled: process.env.WHATSAPP_EVOLUTION_ENABLED,
  baseUrl: process.env.WHATSAPP_EVOLUTION_BASE_URL,
  apiKey: process.env.WHATSAPP_EVOLUTION_API_KEY,
  instance: process.env.WHATSAPP_EVOLUTION_INSTANCE,
  timeout: process.env.WHATSAPP_EVOLUTION_TIMEOUT_MS,
};

describe("EvolutionWhatsAppService", () => {
  afterEach(() => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = originalEnv.enabled;
    process.env.WHATSAPP_EVOLUTION_BASE_URL = originalEnv.baseUrl;
    process.env.WHATSAPP_EVOLUTION_API_KEY = originalEnv.apiKey;
    process.env.WHATSAPP_EVOLUTION_INSTANCE = originalEnv.instance;
    process.env.WHATSAPP_EVOLUTION_TIMEOUT_MS = originalEnv.timeout;
    vi.restoreAllMocks();
  });

  it("returns instance status from Evolution API", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "true";
    process.env.WHATSAPP_EVOLUTION_BASE_URL = "http://evolution.local";
    process.env.WHATSAPP_EVOLUTION_API_KEY = "secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          instance: {
            instanceName: "hubly-main",
            state: "open",
          },
        }),
    });

    const service = new EvolutionWhatsAppService(fetchMock as never);
    const result = await service.getStatus("hubly-main");

    expect(result.state).toBe("open");
  });

  it("sends plain text via Evolution API", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "true";
    process.env.WHATSAPP_EVOLUTION_BASE_URL = "http://evolution.local";
    process.env.WHATSAPP_EVOLUTION_API_KEY = "secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          status: "PENDING",
        }),
    });

    const service = new EvolutionWhatsAppService(fetchMock as never);
    const result = await service.sendText("hubly-main", {
      number: "5511999999999",
      text: "Olá!",
    });

    expect(result.status).toBe("PENDING");
  });

  it("fails when the integration is disabled", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "false";

    const service = new EvolutionWhatsAppService(vi.fn() as never);

    await expect(service.getStatus("hubly-main")).rejects.toBeInstanceOf(AppError);
  });
});
