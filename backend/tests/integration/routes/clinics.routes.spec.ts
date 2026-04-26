import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { signInAsAdmin } from "../helpers/auth";

describe("Organizations routes", () => {
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

  it("lists only organizations from the authenticated tenant", async () => {
    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/organizations",
      headers,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].tradeName).toBe("Organizationa Exemplo");
  });

  it("updates the authenticated organization", async () => {
    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "PATCH",
      url: "/v1/organizations/cln_main_001",
      headers,
      payload: {
        legalName: "Organizationa Exemplo Atualizada LTDA",
        tradeName: "Organizationa Exemplo Atualizada",
        timezone: "America/Sao_Paulo",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().tradeName).toBe("Organizationa Exemplo Atualizada");
  });

  it("updates the public storefront for the authenticated organization", async () => {
    const headers = await signInAsAdmin(app);
    const response = await app.inject({
      method: "PUT",
      url: "/v1/organizations/storefront",
      headers,
      payload: {
        tradeName: "Barbearia Hubly Prime",
        bookingPageSlug: "barbearia-hubly-prime",
        publicDescription: "Cortes, barba e estética masculina com agendamento fácil.",
        publicPhone: "+5511999999999",
        publicEmail: "contato@hubly.test",
        addressLine: "Rua das Flores",
        addressNumber: "123",
        district: "Centro",
        city: "São Paulo",
        state: "SP",
        postalCode: "01000-000",
        coverImageUrl: "https://cdn.example.test/capa.jpg",
        logoImageUrl: "https://cdn.example.test/logo.jpg",
        galleryImageUrls: ["https://cdn.example.test/ambiente.jpg"],
        isStorefrontPublished: true,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: "cln_main_001",
        tradeName: "Barbearia Hubly Prime",
        bookingPageSlug: "barbearia-hubly-prime",
        city: "São Paulo",
        isStorefrontPublished: true,
      }),
    );

    const publicResponse = await app.inject({
      method: "GET",
      url: "/v1/public/organizations/barbearia-hubly-prime",
    });

    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json()).toEqual(
      expect.objectContaining({
        tradeName: "Barbearia Hubly Prime",
        publicDescription: "Cortes, barba e estética masculina com agendamento fácil.",
        galleryImageUrls: ["https://cdn.example.test/ambiente.jpg"],
      }),
    );
  });
});
