import "fastify";

import type { AuthenticatedRequestUser } from "./auth";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthenticatedRequestUser;
  }
}
