import type { FastifyInstance } from "fastify";

import { HealthController } from "../controllers/health.controller";
import { healthRouteSchema } from "../docs/route-schemas";

const healthController = new HealthController();

export const healthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/health", { schema: healthRouteSchema }, healthController.check);
};
