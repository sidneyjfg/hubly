import type { FastifyRequest } from "fastify";

import type { AuthenticatedRequestUser } from "../types/auth";
import { AppError } from "./app-error";

export const getAuthUser = (request: FastifyRequest): AuthenticatedRequestUser => {
  if (!request.authUser) {
    throw new AppError("auth.unauthorized", "Unauthorized request.", 401);
  }

  return request.authUser;
};
