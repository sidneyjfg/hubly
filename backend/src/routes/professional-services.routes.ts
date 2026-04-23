import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { ProfessionalServicesController } from "../controllers/professional-services.controller";
import {
  professionalServicesCreateRouteSchema,
  professionalServicesListRouteSchema,
  professionalServicesStatusRouteSchema,
  professionalServicesUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { ProfessionalServicesRepository } from "../repositories/professional-services.repository";
import { ProfessionalsRepository } from "../repositories/professionals.repository";
import { ProfessionalServicesService } from "../services/professional-services.service";

type ProfessionalServicesRouteOptions = {
  dataSource: DataSource;
};

export const professionalServicesRoutes = async (
  app: FastifyInstance,
  options: ProfessionalServicesRouteOptions,
): Promise<void> => {
  const controller = new ProfessionalServicesController(
    new ProfessionalServicesService(
      new ProfessionalServicesRepository(options.dataSource),
      new ProfessionalsRepository(options.dataSource),
    ),
  );

  app.get(
    "/professional-services",
    {
      preHandler: allowRoles(["administrator", "reception", "professional"]),
      schema: professionalServicesListRouteSchema,
    },
    controller.list,
  );

  app.post(
    "/professional-services",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("professional-services:create")],
      schema: professionalServicesCreateRouteSchema,
    },
    controller.create,
  );

  app.patch(
    "/professional-services/:id",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("professional-services:update")],
      schema: professionalServicesUpdateRouteSchema,
    },
    controller.update,
  );

  app.patch(
    "/professional-services/:id/status",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("professional-services:status")],
      schema: professionalServicesStatusRouteSchema,
    },
    controller.setStatus,
  );
};
