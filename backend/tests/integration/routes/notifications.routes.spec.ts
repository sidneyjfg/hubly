import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../src/app";
import { AppointmentNotificationEntity } from "../../../src/database/entities";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { signInAsAdmin } from "../helpers/auth";

const originalFetch = global.fetch;
const originalEnv = {
  enabled: process.env.WHATSAPP_EVOLUTION_ENABLED,
  baseUrl: process.env.WHATSAPP_EVOLUTION_BASE_URL,
  apiKey: process.env.WHATSAPP_EVOLUTION_API_KEY,
};

describe("Notifications routes", () => {
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
    vi.restoreAllMocks();
  });

  it("stores WhatsApp reminder settings and schedules reminders from appointment events", async () => {
    const headers = await signInAsAdmin(app);

    const updateResponse = await app.inject({
      method: "PUT",
      url: "/v1/notifications/whatsapp/settings",
      headers,
      payload: {
        isEnabled: true,
        reminders: [{ hoursBefore: 24 }, { hoursBefore: 5 }],
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().reminders).toEqual([{ hoursBefore: 24 }, { hoursBefore: 5 }]);

    const startsAt = new Date(Date.now() + (30 * 60 * 60 * 1000));
    const endsAt = new Date(startsAt.getTime() + (30 * 60 * 1000));
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/appointments",
      headers,
      payload: {
        patientId: "pat_001",
        professionalId: "pro_001",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        notes: "Consulta com lembretes",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const appointmentId = createResponse.json().id as string;

    const notifications = await dataSource.getRepository(AppointmentNotificationEntity).find({
      where: {
        appointmentId,
      },
      order: {
        scheduledFor: "ASC",
      },
    });

    expect(notifications).toHaveLength(2);
    expect(notifications.map((item) => item.hoursBefore)).toEqual([24, 5]);

    const cancelResponse = await app.inject({
      method: "PATCH",
      url: `/v1/appointments/${appointmentId}/cancel`,
      headers,
      payload: {
        notes: "Paciente cancelou",
      },
    });

    expect(cancelResponse.statusCode).toBe(200);

    const cancelledNotifications = await dataSource.getRepository(AppointmentNotificationEntity).find({
      where: {
        appointmentId,
      },
      order: {
        scheduledFor: "ASC",
      },
    });

    expect(cancelledNotifications.every((item) => item.status === "cancelled")).toBe(true);
  });

  it("processes due WhatsApp reminders through the integration", async () => {
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
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            key: "msg_123",
            status: "PENDING",
          }),
      }) as never;

    const headers = await signInAsAdmin(app);

    await app.inject({
      method: "GET",
      url: "/v1/integrations/whatsapp/status",
      headers,
    });

    await app.inject({
      method: "PUT",
      url: "/v1/notifications/whatsapp/settings",
      headers,
      payload: {
        isEnabled: true,
        reminders: [{ hoursBefore: 1 }],
      },
    });

    const startsAt = new Date(Date.now() + (2 * 60 * 60 * 1000));
    const endsAt = new Date(startsAt.getTime() + (30 * 60 * 1000));
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/appointments",
      headers,
      payload: {
        patientId: "pat_001",
        professionalId: "pro_001",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
    });

    const appointmentId = createResponse.json().id as string;
    const repository = dataSource.getRepository(AppointmentNotificationEntity);
    const notification = await repository.findOneByOrFail({ appointmentId });
    notification.scheduledFor = new Date(Date.now() - (60 * 60 * 1000));
    await repository.save(notification);

    const processResponse = await app.inject({
      method: "POST",
      url: "/v1/notifications/whatsapp/process",
      headers,
      payload: {
        limit: 10,
      },
    });

    expect(processResponse.statusCode).toBe(200);
    expect(processResponse.json().sentCount).toBe(1);

    const sentNotification = await repository.findOneByOrFail({ id: notification.id });
    expect(sentNotification.status).toBe("sent");
    expect(sentNotification.externalMessageId).toBe("msg_123");
  });
});
