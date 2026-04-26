import type { FastifyReply, FastifyRequest } from "fastify";

import { isApiDocsRoute } from "../docs/register-api-docs";
import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/tokens";

const publicRoutes = new Set([
  "/v1/health",
  "/v1/auth/sign-in",
  "/v1/auth/sign-up",
  "/v1/auth/refresh",
  "/v1/auth/forgot-password",
]);

export const authMiddleware = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  const requestPath = request.url.split("?")[0] ?? request.url;
  const route = request.routeOptions.url ?? requestPath;

  if (publicRoutes.has(route) || route.startsWith("/v1/public/") || isApiDocsRoute(route)) {
    return;
  }

  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("auth.unauthorized", "Missing bearer token.", 401);
  }

  const token = authorization.slice("Bearer ".length);
  const claims = verifyAccessToken(token);

  request.authUser = {
    id: claims.sub,
    organizationId: claims.organizationId,
    role: claims.role,
    sessionId: claims.sessionId,
  };
};
