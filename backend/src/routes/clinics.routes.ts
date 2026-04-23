import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { ClinicsController } from "../controllers/clinics.controller";
import { clinicsCreateRouteSchema, clinicsListRouteSchema, clinicsUpdateRouteSchema } from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { ClinicsRepository } from "../repositories/clinics.repository";
import { ClinicsService } from "../services/clinics.service";

type ClinicsRouteOptions = {
  dataSource: DataSource;
};

export const clinicsRoutes = async (
  app: FastifyInstance,
  options: ClinicsRouteOptions,
): Promise<void> => {
  const clinicsController = new ClinicsController(
    new ClinicsService(new ClinicsRepository(options.dataSource)),
  );

  app.get(
    "/clinics",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: clinicsListRouteSchema,
    },
    clinicsController.list,
  );

  app.post(
    "/clinics",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("clinics:create")],
      schema: clinicsCreateRouteSchema,
    },
    clinicsController.create,
  );

  app.patch(
    "/clinics/:id",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("clinics:update")],
      schema: clinicsUpdateRouteSchema,
    },
    clinicsController.update,
  );
};
