import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { signInAsAdmin } from "../helpers/auth";

describe("Payments routes", () => {
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

  it("lets admin configure dynamic provider commission and online discount", async () => {
    const headers = await signInAsAdmin(app);

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/providers/pro_001/payment-settings",
      headers,
      payload: {
        commissionRateBps: 500,
        onlineDiscountBps: 700,
        absorbsProcessingFee: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(
      expect.objectContaining({
        providerId: "pro_001",
        organizationId: "cln_main_001",
        commissionRateBps: 500,
        onlineDiscountBps: 700,
        absorbsProcessingFee: true,
        mercadoPagoConnected: false,
      }),
    );

    const getResponse = await app.inject({
      method: "GET",
      url: "/v1/providers/pro_001/payment-settings",
      headers,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().commissionRateBps).toBe(500);
  });
});
