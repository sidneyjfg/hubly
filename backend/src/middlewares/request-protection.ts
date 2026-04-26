import type { FastifyReply, FastifyRequest } from "fastify";

import { requestProtection } from "../security/request-protection";
import { getAuthUser } from "../utils/request-auth";

const readIp = (request: FastifyRequest): string => {
  return request.ip || "unknown";
};

export const loginRateLimitMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> => {
  const body = request.body as {
    email?: string;
  };

  await requestProtection.assertLoginAllowed(readIp(request), (body.email ?? "").toLowerCase());
};

export const forgotPasswordRateLimitMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> => {
  const body = request.body as {
    email?: string;
  };

  await requestProtection.enforceForgotPasswordLimit(readIp(request), (body.email ?? "").toLowerCase());
};

export const criticalRouteRateLimitMiddleware =
  (action: string) =>
  async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const authUser = getAuthUser(request);
    await requestProtection.enforceCriticalRouteLimit(`${action}:${authUser.id}:${authUser.organizationId}`);
  };
