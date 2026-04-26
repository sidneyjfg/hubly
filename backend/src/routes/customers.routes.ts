import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { CustomersController } from "../controllers/customers.controller";
import {
  customersCreateRouteSchema,
  customersListRouteSchema,
  customersStatusRouteSchema,
  customersUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { CustomersRepository } from "../repositories/customers.repository";
import { CustomersService } from "../services/customers.service";

type CustomersRouteOptions = {
  dataSource: DataSource;
};

export const customersRoutes = async (
  app: FastifyInstance,
  options: CustomersRouteOptions,
): Promise<void> => {
  const customersController = new CustomersController(
    new CustomersService(new CustomersRepository(options.dataSource)),
  );

  app.get(
    "/customers",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: customersListRouteSchema,
    },
    customersController.list,
  );

  app.post(
    "/customers",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("customers:create")],
      schema: customersCreateRouteSchema,
    },
    customersController.create,
  );

  app.patch(
    "/customers/:id",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("customers:update")],
      schema: customersUpdateRouteSchema,
    },
    customersController.update,
  );

  app.patch(
    "/customers/:id/status",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("customers:status")],
      schema: customersStatusRouteSchema,
    },
    customersController.setStatus,
  );
};
