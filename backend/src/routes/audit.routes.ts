import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { AuditController } from "../controllers/audit.controller";
import { auditEventsRouteSchema } from "../docs/route-schemas";
import { allowRoles } from "../middlewares/rbac";
import { AuditRepository } from "../repositories/audit.repository";
import { AuditService } from "../services/audit.service";

type AuditRouteOptions = {
  dataSource: DataSource;
};

export const auditRoutes = async (
  app: FastifyInstance,
  options: AuditRouteOptions,
): Promise<void> => {
  const auditController = new AuditController(
    new AuditService(new AuditRepository(options.dataSource)),
  );

  app.get(
    "/audit/events",
    {
      preHandler: allowRoles(["administrator"]),
      schema: auditEventsRouteSchema,
    },
    auditController.list,
  );
};
