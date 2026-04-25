import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";

describe("Docs routes", () => {
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

  it("serves the OpenAPI document without authentication", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/docs/json",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/v1/auth/sign-in"]).toBeDefined();
    expect(body.paths["/v1/appointments"]).toBeDefined();
  });

  it("serves a Postman collection with token propagation scripts", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/docs/postman/collection.json",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.info.name).toBe("Hubly Local API");
    expect(JSON.stringify(body)).toContain("pm.environment.set('accessToken', data.accessToken);");
  });
});
