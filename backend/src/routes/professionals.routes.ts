import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { ProfessionalsController } from "../controllers/professionals.controller";
import {
  professionalsCreateRouteSchema,
  professionalsListRouteSchema,
  professionalsStatusRouteSchema,
  professionalsUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { ProfessionalsRepository } from "../repositories/professionals.repository";
import { ProfessionalsService } from "../services/professionals.service";

type ProfessionalsRouteOptions = {
  dataSource: DataSource;
};

export const professionalsRoutes = async (
  app: FastifyInstance,
  options: ProfessionalsRouteOptions,
): Promise<void> => {
  const professionalsController = new ProfessionalsController(
    new ProfessionalsService(new ProfessionalsRepository(options.dataSource)),
  );

  app.get(
    "/professionals",
    {
      preHandler: allowRoles(["administrator", "reception", "professional"]),
      schema: professionalsListRouteSchema,
    },
    professionalsController.list,
  );

  app.post(
    "/professionals",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("professionals:create")],
      schema: professionalsCreateRouteSchema,
    },
    professionalsController.create,
  );

  app.patch(
    "/professionals/:id",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("professionals:update")],
      schema: professionalsUpdateRouteSchema,
    },
    professionalsController.update,
  );

  app.patch(
    "/professionals/:id/status",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("professionals:status")],
      schema: professionalsStatusRouteSchema,
    },
    professionalsController.setStatus,
  );
};
