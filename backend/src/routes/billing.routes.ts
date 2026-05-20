import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { BillingController } from "../controllers/billing.controller";
import { allowRoles } from "../middlewares/rbac";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { BillingService } from "../services/billing.service";

type BillingRouteOptions = {
  dataSource: DataSource;
};

export const billingRoutes = async (
  app: FastifyInstance,
  options: BillingRouteOptions,
): Promise<void> => {
  const controller = new BillingController(new BillingService(options.dataSource));

  app.get(
    "/organization/subscription",
    {
      preHandler: allowRoles(["administrator"]),
    },
    controller.getOrganizationSubscription,
  );

  app.patch(
    "/organization/subscription",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("billing:subscription")],
    },
    controller.changeOrganizationPlan,
  );

  app.post(
    "/organization/subscription/checkout",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("billing:checkout")],
    },
    controller.createSubscriptionCheckout,
  );

  app.post(
    "/organization/subscription/cancel",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("billing:cancel")],
    },
    controller.cancelOrganizationSubscription,
  );
};
