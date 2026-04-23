import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { signInAsAdmin } from "../helpers/auth";

describe("Professionals routes", () => {
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

  it("creates, updates and inactivates professionals in the authenticated tenant", async () => {
    const headers = await signInAsAdmin(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/professionals",
      headers,
      payload: {
        fullName: "Dra. Julia Ribeiro",
        specialty: "Dermatologia",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdProfessional = createResponse.json();

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/professionals/${createdProfessional.id as string}`,
      headers,
      payload: {
        fullName: "Dra. Julia Ribeiro",
        specialty: "Dermatologia Clinica",
        isActive: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().specialty).toBe("Dermatologia Clinica");

    const statusResponse = await app.inject({
      method: "PATCH",
      url: `/v1/professionals/${createdProfessional.id as string}/status`,
      headers,
      payload: {
        isActive: false,
      },
    });

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json().isActive).toBe(false);
  });
});
