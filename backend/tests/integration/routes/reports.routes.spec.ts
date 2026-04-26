import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { signInAsAdmin } from "../helpers/auth";

describe("Reports routes", () => {
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

  it("returns no-show overview based on booking statuses", async () => {
    const headers = await signInAsAdmin(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/reports/no-show-overview?from=2026-04-18&to=2026-04-20",
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().missedBookings).toBeGreaterThan(0);
  });
});
