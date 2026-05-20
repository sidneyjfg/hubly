import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { SystemAdminController } from "../controllers/system-admin.controller";
import { systemAdminAuthMiddleware } from "../middlewares/system-admin-auth";
import { loginRateLimitMiddleware } from "../middlewares/request-protection";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { SystemAdminService } from "../services/system-admin.service";

type SystemAdminRouteOptions = {
  dataSource: DataSource;
};

export const systemAdminRoutes = async (
  app: FastifyInstance,
  options: SystemAdminRouteOptions,
): Promise<void> => {
  const controller = new SystemAdminController(
    new SystemAdminService(
      options.dataSource,
      new OrganizationsRepository(options.dataSource),
      new AuditRepository(options.dataSource),
    ),
  );

  app.post(
    "/system-admin/auth/sign-in",
    {
      preHandler: loginRateLimitMiddleware,
    },
    controller.signIn,
  );

  app.get(
    "/system-admin/tenants",
    {
      preHandler: systemAdminAuthMiddleware,
    },
    controller.listTenants,
  );

  app.get(
    "/system-admin/audit/events",
    {
      preHandler: systemAdminAuthMiddleware,
    },
    controller.listAuditEvents,
  );

  app.get(
    "/system-admin/summary",
    {
      preHandler: systemAdminAuthMiddleware,
    },
    controller.getOperationalSummary,
  );

  app.get(
    "/system-admin/subscription-readiness",
    {
      preHandler: systemAdminAuthMiddleware,
    },
    controller.getSubscriptionReadiness,
  );

  app.get(
    "/system-admin/billing/plans",
    {
      preHandler: systemAdminAuthMiddleware,
    },
    controller.listBillingPlans,
  );

  app.patch(
    "/system-admin/billing/plans/:id",
    {
      preHandler: systemAdminAuthMiddleware,
    },
    controller.updateBillingPlan,
  );
};
