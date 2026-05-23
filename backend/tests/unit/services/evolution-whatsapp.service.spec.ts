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

  it("requests a phone pairing code with POST and disables QR code mode", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "true";
    process.env.WHATSAPP_EVOLUTION_BASE_URL = "http://evolution.local";
    process.env.WHATSAPP_EVOLUTION_API_KEY = "secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairingCode: "12345678",
        }),
    });

    const service = new EvolutionWhatsAppService(fetchMock as never);
    const result = await service.connect("hubly-main", "+55 (11) 99999-9999");

    expect(result.pairingCode).toBe("12345678");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://evolution.local/instance/connect/hubly-main",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ number: "5511999999999" }),
      }),
    );
  });

  it("falls back to GET when POST connect is not accepted", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "true";
    process.env.WHATSAPP_EVOLUTION_BASE_URL = "http://evolution.local";
    process.env.WHATSAPP_EVOLUTION_API_KEY = "secret";

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 405,
        text: async () => JSON.stringify({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            code: "87654321",
          }),
      });

    const service = new EvolutionWhatsAppService(fetchMock as never);
    const result = await service.connect("hubly-main", "5511999999999");

    expect(result.code).toBe("87654321");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://evolution.local/instance/connect/hubly-main?number=5511999999999",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("fails when the integration is disabled", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "false";

    const service = new EvolutionWhatsAppService(vi.fn() as never);

    await expect(service.getStatus("hubly-main")).rejects.toBeInstanceOf(AppError);
  });
});
