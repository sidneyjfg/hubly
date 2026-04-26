import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { ServiceOfferingsController } from "../controllers/service-offerings.controller";
import {
  providerServicesCreateRouteSchema,
  providerServicesListRouteSchema,
  providerServicesStatusRouteSchema,
  providerServicesUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsService } from "../services/service-offerings.service";

type ServiceOfferingsRouteOptions = {
  dataSource: DataSource;
};

export const providerServicesRoutes = async (
  app: FastifyInstance,
  options: ServiceOfferingsRouteOptions,
): Promise<void> => {
  const controller = new ServiceOfferingsController(
    new ServiceOfferingsService(
      new ServiceOfferingsRepository(options.dataSource),
      new ProvidersRepository(options.dataSource),
    ),
  );

  app.get(
    "/service-offerings",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: providerServicesListRouteSchema,
    },
    controller.list,
  );

  app.post(
    "/service-offerings",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("service-offerings:create")],
      schema: providerServicesCreateRouteSchema,
    },
    controller.create,
  );

  app.patch(
    "/service-offerings/:id",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("service-offerings:update")],
      schema: providerServicesUpdateRouteSchema,
    },
    controller.update,
  );

  app.patch(
    "/service-offerings/:id/status",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("service-offerings:status")],
      schema: providerServicesStatusRouteSchema,
    },
    controller.setStatus,
  );
};
