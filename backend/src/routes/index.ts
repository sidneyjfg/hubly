import type { FastifyInstance } from "fastify";

import type { AppDependencies } from "../app";
import { authMiddleware } from "../middlewares/auth";
import { registerErrorHandler } from "../middlewares/error-handler";
import { tenantMiddleware } from "../middlewares/tenant";
import { appointmentsRoutes } from "./appointments.routes";
import { auditRoutes } from "./audit.routes";
import { authRoutes } from "./auth.routes";
import { clinicsRoutes } from "./clinics.routes";
import { healthRoutes } from "./health.routes";
import { integrationsRoutes } from "./integrations.routes";
import { notificationsRoutes } from "./notifications.routes";
import { patientsRoutes } from "./patients.routes";
import { professionalServicesRoutes } from "./professional-services.routes";
import { professionalsRoutes } from "./professionals.routes";
import { reportsRoutes } from "./reports.routes";

const routeRegistry = [
  healthRoutes,
  authRoutes,
  clinicsRoutes,
  professionalsRoutes,
  professionalServicesRoutes,
  patientsRoutes,
  appointmentsRoutes,
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
