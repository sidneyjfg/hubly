import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../src/app";
import { createTestDataSource } from "../../src/database/testing/create-test-data-source";

const originalFetch = global.fetch;
const originalEnv = {
  enabled: process.env.WHATSAPP_EVOLUTION_ENABLED,
  baseUrl: process.env.WHATSAPP_EVOLUTION_BASE_URL,
  apiKey: process.env.WHATSAPP_EVOLUTION_API_KEY,
};

describe("WhatsApp onboarding E2E", () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    app = buildApp({
      dataSource,
    });
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    global.fetch = originalFetch;
    process.env.WHATSAPP_EVOLUTION_ENABLED = originalEnv.enabled;
    process.env.WHATSAPP_EVOLUTION_BASE_URL = originalEnv.baseUrl;
    process.env.WHATSAPP_EVOLUTION_API_KEY = originalEnv.apiKey;
    vi.restoreAllMocks();
  });

  it("signs in, starts the WhatsApp session, checks status and sends a message", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "true";
    process.env.WHATSAPP_EVOLUTION_BASE_URL = "http://evolution.local";
    process.env.WHATSAPP_EVOLUTION_API_KEY = "secret";

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            instance: {
              instanceName: "clinic-cln_main_001",
              status: "close",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            instance: {
              instanceName: "clinic-cln_main_001",
              state: "close",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            pairingCode: "ABC12345",
            count: 1,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            instance: {
              instanceName: "clinic-cln_main_001",
              state: "connecting",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            instance: {
              instanceName: "clinic-cln_main_001",
              state: "open",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            status: "PENDING",
            key: {
              remoteJid: "5531995734976@s.whatsapp.net",
              fromMe: true,
              id: "message-1",
            },
          }),
      }) as never;

    const signInResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "password123",
      },
    });

    expect(signInResponse.statusCode).toBe(200);
    const session = signInResponse.json();
    const headers = {
      authorization: `Bearer ${session.accessToken as string}`,
      "x-clinic-id": session.clinicId as string,
    };

    const startSessionResponse = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/session",
      headers,
      payload: {
        phoneNumber: "5531995734976",
      },
    });

    expect(startSessionResponse.statusCode).toBe(200);
    expect(startSessionResponse.json().pairingCode).toBe("ABC12345");

    const statusResponse = await app.inject({
      method: "GET",
      url: "/v1/integrations/whatsapp/status",
      headers,
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().state).toBe("open");

    const sendMessageResponse = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/messages/send",
      headers,
      payload: {
        number: "5531995734976",
        text: "Teste E2E",
      },
    });

    expect(sendMessageResponse.statusCode).toBe(201);
    expect(sendMessageResponse.json().status).toBe("PENDING");
  });
});
