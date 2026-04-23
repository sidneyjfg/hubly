import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { PatientsController } from "../controllers/patients.controller";
import {
  patientsCreateRouteSchema,
  patientsListRouteSchema,
  patientsStatusRouteSchema,
  patientsUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { PatientsRepository } from "../repositories/patients.repository";
import { PatientsService } from "../services/patients.service";

type PatientsRouteOptions = {
  dataSource: DataSource;
};

export const patientsRoutes = async (
  app: FastifyInstance,
  options: PatientsRouteOptions,
): Promise<void> => {
  const patientsController = new PatientsController(
    new PatientsService(new PatientsRepository(options.dataSource)),
  );

  app.get(
    "/patients",
    {
      preHandler: allowRoles(["administrator", "reception", "professional"]),
      schema: patientsListRouteSchema,
    },
    patientsController.list,
  );

  app.post(
    "/patients",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("patients:create")],
      schema: patientsCreateRouteSchema,
    },
    patientsController.create,
  );

  app.patch(
    "/patients/:id",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("patients:update")],
      schema: patientsUpdateRouteSchema,
    },
    patientsController.update,
  );

  app.patch(
    "/patients/:id/status",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("patients:status")],
      schema: patientsStatusRouteSchema,
    },
    patientsController.setStatus,
  );
};
