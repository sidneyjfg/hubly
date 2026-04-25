import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

import { buildOpenApiDocument } from "./openapi";
import { buildPostmanCollection, buildPostmanEnvironment } from "./postman";

export const apiDocsPublicPrefixes = ["/docs"] as const;

export const isApiDocsRoute = (path: string): boolean => {
  return apiDocsPublicPrefixes.some((prefix) => path.startsWith(prefix));
};

export const registerApiDocs = (app: FastifyInstance): void => {
  app.register(fastifySwagger, {
    openapi: buildOpenApiDocument(),
  });

  app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  app.get(
    "/docs/postman/collection.json",
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      reply
        .header("content-type", "application/json; charset=utf-8")
        .header("content-disposition", 'attachment; filename="hubly-local.collection.json"')
        .send(buildPostmanCollection());
    },
  );

  app.get(
    "/docs/postman/environment.json",
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      reply
        .header("content-type", "application/json; charset=utf-8")
        .header("content-disposition", 'attachment; filename="hubly-local.environment.json"')
        .send(buildPostmanEnvironment());
    },
  );
};
