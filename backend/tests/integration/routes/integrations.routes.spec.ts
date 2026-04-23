import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { signInAsAdmin } from "../helpers/auth";

const originalFetch = global.fetch;
const originalEnv = {
  enabled: process.env.WHATSAPP_EVOLUTION_ENABLED,
  baseUrl: process.env.WHATSAPP_EVOLUTION_BASE_URL,
  apiKey: process.env.WHATSAPP_EVOLUTION_API_KEY,
  instance: process.env.WHATSAPP_EVOLUTION_INSTANCE,
  authHeaderName: process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_NAME,
  authHeaderValue: process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE,
};

describe("Integrations routes", () => {
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

    await requestProtection.reset();

    global.fetch = originalFetch;
    process.env.WHATSAPP_EVOLUTION_ENABLED = originalEnv.enabled;
    process.env.WHATSAPP_EVOLUTION_BASE_URL = originalEnv.baseUrl;
    process.env.WHATSAPP_EVOLUTION_API_KEY = originalEnv.apiKey;
    process.env.WHATSAPP_EVOLUTION_INSTANCE = originalEnv.instance;
    process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_NAME = originalEnv.authHeaderName;
    process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE = originalEnv.authHeaderValue;
    vi.restoreAllMocks();
  });

  it("lists only the WhatsApp integration in the current scope", async () => {
    const headers = await signInAsAdmin(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/integrations",
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items[0].id).toBe("whatsapp");
  });

  it("returns WhatsApp connection status from Evolution API", async () => {
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
              status: "created",
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
      }) as never;

    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/integrations/whatsapp/status",
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().state).toBe("open");
    expect(response.json().instanceName).toBeUndefined();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://evolution.local/instance/create",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://evolution.local/instance/connectionState/clinic-cln_main_001",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("sends WhatsApp plain text through Evolution API", async () => {
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
              status: "created",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            status: "PENDING",
          }),
      }) as never;

    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/messages/send",
      headers,
      payload: {
        number: "5511999999999",
        text: "Olá!",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().status).toBe("PENDING");
  });

  it("registers an audit event when the instance is auto-created", async () => {
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
              status: "created",
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
      }) as never;

    const headers = await signInAsAdmin(app);
    await app.inject({
      method: "GET",
      url: "/v1/integrations/whatsapp/status",
      headers,
    });

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/audit/events",
      headers,
    });

    expect(auditResponse.statusCode).toBe(200);
    expect(
      auditResponse
        .json()
        .items.some((item: { action: string }) => item.action === "integration.whatsapp.instance_created"),
    ).toBe(true);
  });

  it("starts the WhatsApp session with the provided phone number", async () => {
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
              state: "close",
            },
          }),
      }) as never;

    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/session",
      headers,
      payload: {
        phoneNumber: "5531995734976",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().instanceName).toBeUndefined();
    expect(response.json().pairingCode).toBe("ABC12345");
    expect(response.json().phoneNumber).toBe("5531995734976");

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/integrations",
      headers,
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().items[0].phoneNumber).toBe("5531995734976");
  });

  it("does not generate a WhatsApp code when the instance is already connected", async () => {
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
              status: "open",
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
      }) as never;

    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/session",
      headers,
      payload: {
        phoneNumber: "5531995734976",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("whatsapp.already_connected");
    expect(global.fetch).not.toHaveBeenCalledWith(
      "http://evolution.local/instance/connect/clinic-cln_main_001?number=5531995734976",
      expect.anything(),
    );
  });

  it("disconnects WhatsApp without exposing the internal instance name", async () => {
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
              status: "open",
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
        text: async () => JSON.stringify({}),
      }) as never;

    const headers = await signInAsAdmin(app);
    await app.inject({
      method: "GET",
      url: "/v1/integrations/whatsapp/status",
      headers,
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/disconnect",
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      state: "disconnected",
    });
    expect(response.json().instanceName).toBeUndefined();
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://evolution.local/instance/logout/clinic-cln_main_001",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("regenerates the WhatsApp connection code", async () => {
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
          JSON.stringify({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            pairingCode: "NEWCODE99",
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
      }) as never;

    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/integrations/whatsapp/session/regenerate-code",
      headers,
      payload: {
        phoneNumber: "5531995734976",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().pairingCode).toBe("NEWCODE99");
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://evolution.local/instance/restart/clinic-cln_main_001",
      expect.objectContaining({
        method: "PUT",
      }),
    );
  });
});
