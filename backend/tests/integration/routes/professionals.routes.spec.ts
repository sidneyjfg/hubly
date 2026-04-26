import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { signInAsAdmin } from "../helpers/auth";

describe("Providers routes", () => {
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

  it("creates, updates and inactivates providers in the authenticated tenant", async () => {
    const headers = await signInAsAdmin(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/providers",
      headers,
      payload: {
        fullName: "Dra. Julia Ribeiro",
        specialty: "Dermatologia",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdProvider = createResponse.json();

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/providers/${createdProvider.id as string}`,
      headers,
      payload: {
        fullName: "Dra. Julia Ribeiro",
        specialty: "Dermatologia Organizationa",
        isActive: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().specialty).toBe("Dermatologia Organizationa");

    const statusResponse = await app.inject({
      method: "PATCH",
      url: `/v1/providers/${createdProvider.id as string}/status`,
      headers,
      payload: {
        isActive: false,
      },
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().isActive).toBe(false);
  });

  it("replaces and lists provider availability with workday and lunch break", async () => {
    const headers = await signInAsAdmin(app);

    const replaceResponse = await app.inject({
      method: "PUT",
      url: "/v1/providers/pro_001/availability",
      headers,
      payload: [
        {
          weekday: 1,
          workStart: "08:00",
          workEnd: "17:30",
          lunchStart: "12:00",
          lunchEnd: "13:00",
          isActive: true,
        },
        {
          weekday: 2,
          workStart: "09:00",
          workEnd: "18:00",
          lunchStart: null,
          lunchEnd: null,
          isActive: true,
        },
      ],
    });

    expect(replaceResponse.statusCode).toBe(200);
    expect(replaceResponse.json()).toHaveLength(2);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/providers/pro_001/availability",
      headers,
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([
      expect.objectContaining({
        providerId: "pro_001",
        weekday: 1,
        workStart: "08:00",
        workEnd: "17:30",
        lunchStart: "12:00",
        lunchEnd: "13:00",
      }),
      expect.objectContaining({
        providerId: "pro_001",
        weekday: 2,
        workStart: "09:00",
        workEnd: "18:00",
        lunchStart: null,
        lunchEnd: null,
      }),
    ]);
  });
});
