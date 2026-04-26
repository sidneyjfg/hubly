import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { ReportsController } from "../controllers/reports.controller";
import { noShowOverviewRouteSchema, reportsCatalogRouteSchema } from "../docs/route-schemas";
import { allowRoles } from "../middlewares/rbac";
import { BookingsRepository } from "../repositories/bookings.repository";
import { ReportsService } from "../services/reports.service";

type ReportsRouteOptions = {
  dataSource: DataSource;
};

export const reportsRoutes = async (
  app: FastifyInstance,
  options: ReportsRouteOptions,
): Promise<void> => {
  const reportsController = new ReportsController(
    new ReportsService(new BookingsRepository(options.dataSource)),
  );

  app.get(
    "/reports/catalog",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: reportsCatalogRouteSchema,
    },
    reportsController.listCatalog,
  );

  app.get(
    "/reports/no-show-overview",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: noShowOverviewRouteSchema,
    },
    reportsController.noShowOverview,
  );
};
