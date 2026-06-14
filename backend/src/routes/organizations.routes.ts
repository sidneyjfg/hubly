import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { OrganizationsController } from "../controllers/organizations.controller";
import { organizationsCreateRouteSchema, organizationsListRouteSchema, organizationsUpdateRouteSchema } from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { OrganizationsService } from "../services/organizations.service";
import { PlanEntitlementsService } from "../services/plan-entitlements.service";

type OrganizationsRouteOptions = {
  dataSource: DataSource;
};

export const organizationsRoutes = async (
  app: FastifyInstance,
  options: OrganizationsRouteOptions,
): Promise<void> => {
  const organizationsController = new OrganizationsController(
    new OrganizationsService(
      new OrganizationsRepository(options.dataSource),
      new OrganizationNotificationSettingsRepository(options.dataSource),
      new PlanEntitlementsService(options.dataSource),
    ),
  );

  app.get(
    "/organizations",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: organizationsListRouteSchema,
    },
    organizationsController.list,
  );

  app.post(
    "/organizations",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("organizations:create")],
      schema: organizationsCreateRouteSchema,
    },
    organizationsController.create,
  );

  app.get(
    "/public/assets/storefront/:organizationId/:fileName",
    organizationsController.getStorefrontImage,
  );

  app.get(
    "/organizations/storefront",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
    },
    organizationsController.getStorefront,
  );

  app.put(
    "/organizations/storefront",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("organizations:storefront")],
    },
    organizationsController.updateStorefront,
  );

  app.post(
    "/organizations/storefront/images",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("organizations:storefront-images")],
    },
    organizationsController.uploadStorefrontImage,
  );

  app.delete(
    "/organizations/storefront/images",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("organizations:storefront-images")],
    },
    organizationsController.deleteStorefrontImage,
  );

  app.patch(
    "/organizations/:id",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("organizations:update")],
      schema: organizationsUpdateRouteSchema,
    },
    organizationsController.update,
  );
};
