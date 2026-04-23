import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { signInAsAdmin } from "../helpers/auth";

const originalEnv = {
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_WINDOW_MS: process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
  LOGIN_BRUTE_FORCE_THRESHOLD: process.env.LOGIN_BRUTE_FORCE_THRESHOLD,
  LOGIN_BRUTE_FORCE_BLOCK_MS: process.env.LOGIN_BRUTE_FORCE_BLOCK_MS,
  PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS: process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS,
  PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS: process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS,
  CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS: process.env.CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS,
  CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS: process.env.CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS,
};

describe("Security protections", () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = buildApp({
      dataSource,
    });
    await app.ready();
  });

  afterEach(async () => {
    await requestProtection.reset();

    process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS = originalEnv.LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = originalEnv.LOGIN_RATE_LIMIT_WINDOW_MS;
    process.env.LOGIN_BRUTE_FORCE_THRESHOLD = originalEnv.LOGIN_BRUTE_FORCE_THRESHOLD;
    process.env.LOGIN_BRUTE_FORCE_BLOCK_MS = originalEnv.LOGIN_BRUTE_FORCE_BLOCK_MS;
    process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS = originalEnv.PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS;
    process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS = originalEnv.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS;
    process.env.CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS = originalEnv.CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS;
    process.env.CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS = originalEnv.CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it("rate limits login attempts", async () => {
    process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS = "1";
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.LOGIN_BRUTE_FORCE_THRESHOLD = "10";
    process.env.LOGIN_BRUTE_FORCE_BLOCK_MS = "60000";

    const firstResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "wrong-password",
      },
    });

    expect(firstResponse.statusCode).toBe(401);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "wrong-password",
      },
    });

    expect(secondResponse.statusCode).toBe(429);
  });

  it("blocks brute force attempts after repeated invalid logins", async () => {
    process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS = "10";
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.LOGIN_BRUTE_FORCE_THRESHOLD = "2";
    process.env.LOGIN_BRUTE_FORCE_BLOCK_MS = "60000";

    await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "wrong-password",
      },
    });

    await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "wrong-password",
      },
    });

    const blockedResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "password123",
      },
    });

    expect(blockedResponse.statusCode).toBe(429);
  });

  it("rate limits forgot-password attempts", async () => {
    process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS = "1";
    process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS = "60000";

    const firstResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/forgot-password",
      payload: {
        email: "admin@clinic.test",
      },
    });

    expect(firstResponse.statusCode).toBe(202);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/forgot-password",
      payload: {
        email: "admin@clinic.test",
      },
    });

    expect(secondResponse.statusCode).toBe(429);
  });

  it("rate limits critical routes", async () => {
    process.env.CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS = "1";
    process.env.CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS = "60000";

    const headers = await signInAsAdmin(app);

    const firstResponse = await app.inject({
      method: "POST",
      url: "/v1/patients",
      headers,
      payload: {
        fullName: "Paciente Um",
        email: "paciente1@test.local",
        phone: "+5511911111111",
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/v1/patients",
      headers,
      payload: {
        fullName: "Paciente Dois",
        email: "paciente2@test.local",
        phone: "+5511922222222",
      },
    });

    expect(secondResponse.statusCode).toBe(429);
  });
});
