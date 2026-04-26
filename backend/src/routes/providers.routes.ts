import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { ProvidersController } from "../controllers/providers.controller";
import {
  providerAvailabilityListRouteSchema,
  providerAvailabilityReplaceRouteSchema,
  providersCreateRouteSchema,
  providersListRouteSchema,
  providersStatusRouteSchema,
  providersUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ProvidersService } from "../services/providers.service";

type ProvidersRouteOptions = {
  dataSource: DataSource;
};

export const providersRoutes = async (
  app: FastifyInstance,
  options: ProvidersRouteOptions,
): Promise<void> => {
  const providersController = new ProvidersController(
    new ProvidersService(
      new ProvidersRepository(options.dataSource),
      new ProviderAvailabilitiesRepository(options.dataSource),
    ),
  );

  app.get(
    "/providers",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: providersListRouteSchema,
    },
    providersController.list,
  );

  app.post(
    "/providers",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("providers:create")],
      schema: providersCreateRouteSchema,
    },
    providersController.create,
  );

  app.patch(
    "/providers/:id",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("providers:update")],
      schema: providersUpdateRouteSchema,
    },
    providersController.update,
  );

  app.patch(
    "/providers/:id/status",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("providers:status")],
      schema: providersStatusRouteSchema,
    },
    providersController.setStatus,
  );

  app.get(
    "/providers/:id/availability",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: providerAvailabilityListRouteSchema,
    },
    providersController.listAvailability,
  );

  app.put(
    "/providers/:id/availability",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("providers:availability")],
      schema: providerAvailabilityReplaceRouteSchema,
    },
    providersController.replaceAvailability,
  );
};
