import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../utils/app-error";
import type { Role } from "../utils/roles";

export const allowRoles =
  (roles: readonly Role[]) =>
  async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      throw new AppError("auth.unauthorized", "Unauthorized request.", 401);
    }

    if (!roles.includes(request.authUser.role)) {
      throw new AppError("auth.forbidden", "Forbidden.", 403);
    }
  };
