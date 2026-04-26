import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";

describe("Public bookings routes", () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = buildApp({
      dataSource,
    });
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it("returns the public booking page for an organization slug", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/public/organizations/organizationa-exemplo",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        organizationId: "cln_main_001",
        bookingPageSlug: "organizationa-exemplo",
        tradeName: "Organizationa Exemplo",
      }),
    );
  });

  it("lists published establishments for the customer marketplace", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/public/organizations",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bookingPageSlug: "organizationa-exemplo",
          isStorefrontPublished: true,
        }),
      ]),
    );
  });

  it("returns only available provider slots inside working hours and outside lunch", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/public/organizations/organizationa-exemplo/availability?providerId=pro_001&date=2026-04-21",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as { items: Array<{ startsAt: string; endsAt: string }> };
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startsAt: "2026-04-21T08:00:00.000Z",
          endsAt: "2026-04-21T08:30:00.000Z",
        }),
      ]),
    );
    expect(body.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startsAt: "2026-04-21T12:30:00.000Z",
          endsAt: "2026-04-21T13:00:00.000Z",
        }),
      ]),
    );
  });

  it("creates a public booking and blocks times outside provider availability", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/public/organizations/organizationa-exemplo/bookings",
      payload: {
        fullName: "Roberta Lima",
        email: "roberta@customer.test",
        phone: "+5511955555555",
        password: "password123",
        providerId: "pro_001",
        startsAt: "2026-04-21T14:00:00.000Z",
        endsAt: "2026-04-21T14:30:00.000Z",
        notes: "Agendamento publico",
        paymentType: "presential",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        organizationId: "cln_main_001",
        providerId: "pro_001",
        customerName: "Roberta Lima",
        status: "scheduled",
        paymentType: "presential",
        paymentStatus: "pending_local",
      }),
    );

    const outsideResponse = await app.inject({
      method: "POST",
      url: "/v1/public/organizations/organizationa-exemplo/bookings",
      payload: {
        fullName: "Roberta Lima",
        email: "roberta@customer.test",
        phone: "+5511955555555",
        password: "password123",
        providerId: "pro_001",
        startsAt: "2026-04-21T12:30:00.000Z",
        endsAt: "2026-04-21T13:00:00.000Z",
      },
    });

    expect(outsideResponse.statusCode).toBe(409);
  });
});
