import type { FastifyReply, FastifyRequest } from "fastify";

import { isApiDocsRoute } from "../docs/register-api-docs";
import { AppError } from "../utils/app-error";

const publicRoutes = new Set([
  "/v1/health",
  "/v1/auth/sign-in",
  "/v1/auth/sign-up",
  "/v1/auth/refresh",
  "/v1/auth/forgot-password",
]);

export const tenantMiddleware = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  const requestPath = request.url.split("?")[0] ?? request.url;
  const route = request.routeOptions.url ?? requestPath;

  if (publicRoutes.has(route) || isApiDocsRoute(route)) {
    return;
  }

  if (!request.authUser) {
    throw new AppError("auth.unauthorized", "Unauthorized request.", 401);
  }

  const clinicHeader = request.headers["x-clinic-id"];
  if (typeof clinicHeader === "string" && clinicHeader !== request.authUser.clinicId) {
    throw new AppError("tenant.access_denied", "Tenant mismatch.", 403);
  }
};
