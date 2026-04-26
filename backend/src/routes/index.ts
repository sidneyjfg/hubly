import type { FastifyInstance } from "fastify";

import type { AppDependencies } from "../app";
import { authMiddleware } from "../middlewares/auth";
import { registerErrorHandler } from "../middlewares/error-handler";
import { tenantMiddleware } from "../middlewares/tenant";
import { bookingsRoutes } from "./bookings.routes";
import { auditRoutes } from "./audit.routes";
import { authRoutes } from "./auth.routes";
import { organizationsRoutes } from "./organizations.routes";
import { healthRoutes } from "./health.routes";
import { integrationsRoutes } from "./integrations.routes";
import { notificationsRoutes } from "./notifications.routes";
import { publicBookingsRoutes } from "./public-bookings.routes";
import { customersRoutes } from "./customers.routes";
import { providerServicesRoutes } from "./service-offerings.routes";
import { providersRoutes } from "./providers.routes";
import { reportsRoutes } from "./reports.routes";

const routeRegistry = [
  healthRoutes,
  publicBookingsRoutes,
  authRoutes,
  organizationsRoutes,
  providersRoutes,
  providerServicesRoutes,
  customersRoutes,
  bookingsRoutes,
  notificationsRoutes,
  integrationsRoutes,
  reportsRoutes,
  auditRoutes,
] as const;

export const registerRoutes = (app: FastifyInstance, dependencies: AppDependencies): void => {
  registerErrorHandler(app);
  app.addHook("preHandler", authMiddleware);
  app.addHook("preHandler", tenantMiddleware);

  for (const route of routeRegistry) {
    app.register(route, {
      prefix: "/v1",
      ...dependencies,
    });
  }
};
