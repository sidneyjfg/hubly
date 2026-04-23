import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DataSource } from "typeorm";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";

describe("Auth routes", () => {
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

  it("signs in with valid credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "admin@clinic.test",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.accessToken.split(".")).toHaveLength(3);
    expect(body.refreshToken.split(".")).toHaveLength(3);
    expect(body.role).toBe("administrator");
  });

  it("signs up a clinic admin and returns a session", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-up",
      payload: {
        fullName: "Camila Freitas",
        email: "camila@nova-clinica.test",
        phone: "+5511955555555",
        password: "password123",
        clinic: {
          legalName: "Nova Clinica LTDA",
          tradeName: "Nova Clinica",
          timezone: "America/Sao_Paulo",
        },
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.accessToken.split(".")).toHaveLength(3);
    expect(body.role).toBe("administrator");
    expect(body.clinicId).toBeTruthy();
  });

  it("returns the authenticated account profile through me", async () => {
    const signUpResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-up",
      payload: {
        fullName: "Marcos Teixeira",
        email: "marcos@me-route.test",
        phone: "+5511966666666",
        password: "password123",
        clinic: {
          legalName: "Clinica Perfil LTDA",
          tradeName: "Clinica Perfil",
          timezone: "America/Sao_Paulo",
        },
      },
    });

    const session = signUpResponse.json();
    const meResponse = await app.inject({
      method: "GET",
      url: "/v1/auth/me",
      headers: {
        authorization: `Bearer ${session.accessToken as string}`,
        "x-clinic-id": session.clinicId as string,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    const body = meResponse.json();
    expect(body.user.email).toBe("marcos@me-route.test");
    expect(body.user.phone).toBe("+5511966666666");
    expect(body.clinic.tradeName).toBe("Clinica Perfil");
  });

  it("updates account data and password for the authenticated user", async () => {
    const signUpResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-up",
      payload: {
        fullName: "Renata Barros",
        email: "renata@account-route.test",
        phone: "+5511977777777",
        password: "password123",
        clinic: {
          legalName: "Clinica Conta LTDA",
          tradeName: "Clinica Conta",
          timezone: "America/Sao_Paulo",
        },
      },
    });

    const session = signUpResponse.json();
    const headers = {
      authorization: `Bearer ${session.accessToken as string}`,
      "x-clinic-id": session.clinicId as string,
    };

    const accountResponse = await app.inject({
      method: "PATCH",
      url: "/v1/auth/account",
      headers,
      payload: {
        fullName: "Renata Barros Silva",
        email: "renata.silva@account-route.test",
        phone: "+5511988888888",
      },
    });

    expect(accountResponse.statusCode).toBe(200);
    expect(accountResponse.json().user.fullName).toBe("Renata Barros Silva");

    const passwordResponse = await app.inject({
      method: "PATCH",
      url: "/v1/auth/password",
      headers,
      payload: {
        currentPassword: "password123",
        newPassword: "password456",
      },
    });

    expect(passwordResponse.statusCode).toBe(200);

    const oldSignInResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "renata.silva@account-route.test",
        password: "password123",
      },
    });

    expect(oldSignInResponse.statusCode).toBe(401);

    const newSignInResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/sign-in",
      payload: {
        email: "renata.silva@account-route.test",
        password: "password456",
      },
    });

    expect(newSignInResponse.statusCode).toBe(200);
  });
});
