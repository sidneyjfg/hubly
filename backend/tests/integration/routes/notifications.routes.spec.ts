import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../src/app";
import { BookingNotificationEntity, OrganizationSubscriptionEntity } from "../../../src/database/entities";
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
    await dataSource.getRepository(OrganizationSubscriptionEntity).update(
      { organizationId: "cln_main_001", stripeMode: "test" },
      { billingPlanId: "plan_pro_test" },
    );
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

  it("stores WhatsApp reminder settings and schedules reminders from booking events", async () => {
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

    // Usando 2029 para garantir que os lembretes de 24h e 5h estejam no futuro
    const startsAt = new Date("2029-04-30T14:00:00.000Z");
    const endsAt = new Date("2029-04-30T14:30:00.000Z");
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/bookings",
      headers,
      payload: {
        customerId: "pat_001",
        providerId: "pro_001",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        notes: "Consulta com lembretes",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const bookingId = createResponse.json().id as string;

    const notifications = await dataSource.getRepository(BookingNotificationEntity).find({
      where: {
        bookingId,
      },
      order: {
        scheduledFor: "ASC",
      },
    });

    expect(notifications).toHaveLength(2);
    expect(notifications.map((item) => item.hoursBefore)).toEqual([24, 5]);

    const cancelResponse = await app.inject({
      method: "PATCH",
      url: `/v1/bookings/${bookingId}/cancel`,
      headers,
      payload: {
        notes: "Paciente cancelou",
      },
    });

    expect(cancelResponse.statusCode).toBe(200);

    const cancelledNotifications = await dataSource.getRepository(BookingNotificationEntity).find({
      where: {
        bookingId,
      },
      order: {
        scheduledFor: "ASC",
      },
    });

    expect(cancelledNotifications.every((item) => item.status === "cancelled")).toBe(true);
  });

  it("stores booking event notification settings", async () => {
    const headers = await signInAsAdmin(app);

    const updateResponse = await app.inject({
      method: "PUT",
      url: "/v1/notifications/booking-events/settings",
      headers,
      payload: {
        isEnabled: true,
        events: [
          { event: "created", isEnabled: true },
          { event: "confirmed", isEnabled: true },
          { event: "rescheduled", isEnabled: false },
          { event: "cancelled", isEnabled: true },
        ],
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(
      expect.objectContaining({
        channel: "booking_events",
        isEnabled: true,
      }),
    );
    expect(updateResponse.json().events).toEqual([
      { event: "created", isEnabled: true },
      { event: "confirmed", isEnabled: true },
      { event: "rescheduled", isEnabled: false },
      { event: "cancelled", isEnabled: true },
    ]);

    const getResponse = await app.inject({
      method: "GET",
      url: "/v1/notifications/booking-events/settings",
      headers,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().events).toEqual(updateResponse.json().events);
  });

  it("processes due WhatsApp reminders through the integration", async () => {
    process.env.WHATSAPP_EVOLUTION_ENABLED = "true";
    process.env.WHATSAPP_EVOLUTION_BASE_URL = "http://evolution.local";
    process.env.WHATSAPP_EVOLUTION_API_KEY = "secret";
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, // 1. getStatus (check existing in ensureWhatsAppIntegration)
        text: async () =>
          JSON.stringify({
            instance: {
              instanceName: "organization-cln_main_001",
              state: "close",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true, // 2. setPairingCodeMode (in ensureWhatsAppIntegration)
        text: async () => JSON.stringify({}),
      })
      .mockResolvedValueOnce({
        ok: true, // 3. getStatus (called by getWhatsAppStatus route handler)
        text: async () =>
          JSON.stringify({
            instance: {
              instanceName: "organization-cln_main_001",
              state: "open",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true, // 4. sendText (called by processDueWhatsAppReminders)
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

    const startsAt = new Date("2029-04-30T15:00:00.000Z");
    const endsAt = new Date("2029-04-30T15:30:00.000Z");
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/bookings",
      headers,
      payload: {
        customerId: "pat_001",
        providerId: "pro_001",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const bookingId = createResponse.json().id as string;
    const repository = dataSource.getRepository(BookingNotificationEntity);
    const notification = await repository.findOneByOrFail({ bookingId });
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
