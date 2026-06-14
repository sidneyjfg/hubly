import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { OrganizationNotificationSettingEntity } from "../../../src/database/entities";
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

  it("requires booking event automations before publishing the storefront", async () => {
    const headers = await signInAsAdmin(app);
    const automationPayload = {
      events: [
        { event: "created", isEnabled: true },
        { event: "confirmed", isEnabled: true },
        { event: "rescheduled", isEnabled: true },
        { event: "cancelled", isEnabled: true },
      ],
    };

    const disabledAutomationResponse = await app.inject({
      method: "PUT",
      url: "/v1/notifications/booking-events/settings",
      headers,
      payload: {
        isEnabled: false,
        ...automationPayload,
      },
    });

    expect(disabledAutomationResponse.statusCode).toBe(200);

    const publishResponse = await app.inject({
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

    expect(publishResponse.statusCode).toBe(409);
    expect(publishResponse.json().error.code).toBe("storefront.automation_required");

    await dataSource.getRepository(OrganizationNotificationSettingEntity).update({
      organizationId: "cln_main_001",
      channel: "booking_events",
    }, {
      isEnabled: true,
      rulesJson: JSON.stringify(automationPayload.events),
    });

    const publishAfterRestoredAutomationResponse = await app.inject({
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

    expect(publishAfterRestoredAutomationResponse.statusCode).toBe(200);
  });

  it("stores storefront images internally and serves them through a public URL", async () => {
    const headers = await signInAsAdmin(app);
    const uploadResponse = await app.inject({
      method: "POST",
      url: "/v1/organizations/storefront/images",
      headers,
      payload: {
        slot: "cover",
        fileName: "capa.png",
        contentType: "image/png",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      },
    });

    expect(uploadResponse.statusCode).toBe(201);
    expect(uploadResponse.json()).toEqual(
      expect.objectContaining({
        contentType: "image/png",
        sizeBytes: expect.any(Number),
      }),
    );

    const imageUrl = uploadResponse.json().url as string;
    expect(imageUrl).toContain("/v1/public/assets/storefront/cln_main_001/");

    const publicAssetUrl = new URL(imageUrl);
    const assetResponse = await app.inject({
      method: "GET",
      url: publicAssetUrl.pathname,
    });

    expect(assetResponse.statusCode).toBe(200);
    expect(assetResponse.headers["content-type"]).toContain("image/png");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/v1/organizations/storefront/images",
      headers,
      payload: {
        url: imageUrl,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const removedAssetResponse = await app.inject({
      method: "GET",
      url: publicAssetUrl.pathname,
    });

    expect(removedAssetResponse.statusCode).toBe(404);
  });
});
