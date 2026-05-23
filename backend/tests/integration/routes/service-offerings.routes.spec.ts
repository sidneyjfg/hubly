import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { signInAsAdmin } from "../helpers/auth";

describe("Service offerings routes", () => {
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
  });

  it("blocks active service creation when the current plan service limit is reached", async () => {
    const headers = await signInAsAdmin(app);

    const firstResponse = await app.inject({
      method: "POST",
      url: "/v1/service-offerings",
      headers,
      payload: {
        providerId: "pro_001",
        name: "Retorno breve",
        durationMinutes: 20,
        priceCents: 9000,
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/v1/service-offerings",
      headers,
      payload: {
        providerId: "pro_001",
        name: "Acompanhamento mensal",
        durationMinutes: 30,
        priceCents: 12000,
      },
    });

    expect(secondResponse.statusCode).toBe(403);
    expect(secondResponse.json()).toEqual(
      expect.objectContaining({
        code: "billing.plan_limit.service_offerings",
      }),
    );
  });
});
