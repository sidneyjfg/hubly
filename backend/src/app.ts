import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { registerApiDocs } from "./docs/register-api-docs";
import { registerRoutes } from "./routes/index";
import { env } from "./utils/env";

export type AppDependencies = {
  dataSource: DataSource;
};

const corsAllowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].join(", ");
const corsAllowedHeaders = ["authorization", "content-type", "x-clinic-id"].join(", ");

const resolveAllowedOrigin = (origin: string | undefined): string | null => {
  if (!origin) {
    return null;
  }

  return env.CORS_ALLOWED_ORIGINS.includes(origin) ? origin : null;
};

export const buildApp = (dependencies: AppDependencies): FastifyInstance => {
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", async (request, reply) => {
    const allowedOrigin = resolveAllowedOrigin(request.headers.origin);

    if (allowedOrigin) {
      reply.header("vary", "Origin");
      reply.header("access-control-allow-origin", allowedOrigin);
      reply.header("access-control-allow-methods", corsAllowedMethods);
      reply.header("access-control-allow-headers", corsAllowedHeaders);
    }

    if (request.method === "OPTIONS") {
      reply.status(204).send();
    }
  });

  registerApiDocs(app);
  registerRoutes(app, dependencies);

  return app;
};
