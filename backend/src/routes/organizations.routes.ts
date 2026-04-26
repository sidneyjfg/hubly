import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { OrganizationsController } from "../controllers/organizations.controller";
import { organizationsCreateRouteSchema, organizationsListRouteSchema, organizationsUpdateRouteSchema } from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { OrganizationsService } from "../services/organizations.service";

type OrganizationsRouteOptions = {
  dataSource: DataSource;
};

export const organizationsRoutes = async (
  app: FastifyInstance,
  options: OrganizationsRouteOptions,
): Promise<void> => {
  const organizationsController = new OrganizationsController(
    new OrganizationsService(new OrganizationsRepository(options.dataSource)),
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

  app.patch(
    "/organizations/:id",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("organizations:update")],
      schema: organizationsUpdateRouteSchema,
    },
    organizationsController.update,
  );
};
