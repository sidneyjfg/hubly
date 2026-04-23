import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { signInAsAdmin } from "../helpers/auth";

describe("Appointments routes", () => {
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

  it("lists seeded appointments with patient and professional names", async () => {
    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/appointments",
      headers,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].patientName).toBeDefined();
    expect(body.items[0].professionalName).toBeDefined();
  });

  it("creates, reschedules and cancels an appointment with conflict protection", async () => {
    const headers = await signInAsAdmin(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/appointments",
      headers,
      payload: {
        patientId: "pat_001",
        professionalId: "pro_001",
        startsAt: "2026-04-21T12:00:00.000Z",
        endsAt: "2026-04-21T12:30:00.000Z",
        notes: "Primeira consulta",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdAppointment = createResponse.json();

    const conflictResponse = await app.inject({
      method: "POST",
      url: "/v1/appointments",
      headers,
      payload: {
        patientId: "pat_002",
        professionalId: "pro_001",
        startsAt: "2026-04-21T12:15:00.000Z",
        endsAt: "2026-04-21T12:45:00.000Z",
      },
    });

    expect(conflictResponse.statusCode).toBe(409);

    const rescheduleResponse = await app.inject({
      method: "PATCH",
      url: `/v1/appointments/${createdAppointment.id as string}/reschedule`,
      headers,
      payload: {
        patientId: "pat_001",
        professionalId: "pro_001",
        startsAt: "2026-04-21T13:00:00.000Z",
        endsAt: "2026-04-21T13:30:00.000Z",
        notes: "Horario reagendado",
      },
    });

    expect(rescheduleResponse.statusCode).toBe(200);
    expect(rescheduleResponse.json().status).toBe("rescheduled");

    const cancelResponse = await app.inject({
      method: "PATCH",
      url: `/v1/appointments/${createdAppointment.id as string}/cancel`,
      headers,
      payload: {
        notes: "Paciente cancelou",
      },
    });

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json().status).toBe("cancelled");
  });

  it("returns daily and weekly schedules", async () => {
    const headers = await signInAsAdmin(app);

    const dailyResponse = await app.inject({
      method: "GET",
      url: "/v1/appointments/daily-schedule?date=2026-04-20",
      headers,
    });

    expect(dailyResponse.statusCode).toBe(200);
    expect(dailyResponse.json().items.length).toBeGreaterThan(0);

    const weeklyResponse = await app.inject({
      method: "GET",
      url: "/v1/appointments/weekly-schedule?date=2026-04-20",
      headers,
    });

    expect(weeklyResponse.statusCode).toBe(200);
    expect(weeklyResponse.json().items.length).toBeGreaterThan(0);
  });

  it("prevents double booking when two create requests hit the same slot concurrently", async () => {
    const headers = await signInAsAdmin(app);

    const [firstResponse, secondResponse] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/v1/appointments",
        headers,
        payload: {
          patientId: "pat_001",
          professionalId: "pro_001",
          startsAt: "2026-04-22T15:00:00.000Z",
          endsAt: "2026-04-22T15:30:00.000Z",
          notes: "Consulta concorrente A",
        },
      }),
      app.inject({
        method: "POST",
        url: "/v1/appointments",
        headers,
        payload: {
          patientId: "pat_002",
          professionalId: "pro_001",
          startsAt: "2026-04-22T15:00:00.000Z",
          endsAt: "2026-04-22T15:30:00.000Z",
          notes: "Consulta concorrente B",
        },
      }),
    ]);

    const statusCodes = [firstResponse.statusCode, secondResponse.statusCode].sort();
    expect(statusCodes).toEqual([201, 409]);
  });
});
