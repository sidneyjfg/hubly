import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { signInAsAdmin } from "../helpers/auth";

describe("Patients routes", () => {
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

  it("creates and updates patients in the authenticated tenant", async () => {
    const headers = await signInAsAdmin(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/patients",
      headers,
      payload: {
        fullName: "Marcos Paulo",
        email: "marcos@patient.test",
        phone: "+5511955555555",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdPatient = createResponse.json();

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/patients/${createdPatient.id as string}`,
      headers,
      payload: {
        fullName: "Marcos Paulo Lima",
        email: "marcos.lima@patient.test",
        phone: "+5511944444444",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().fullName).toBe("Marcos Paulo Lima");
  });
});
