import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { AuthController } from "../controllers/auth.controller";
import {
  authMeRouteSchema,
  authSignUpRouteSchema,
  authUpdateAccountRouteSchema,
  authUpdatePasswordRouteSchema,
  forgotPasswordRouteSchema,
  refreshRouteSchema,
  signInRouteSchema,
} from "../docs/route-schemas";
import { forgotPasswordRateLimitMiddleware, loginRateLimitMiddleware } from "../middlewares/request-protection";
import { AuditRepository } from "../repositories/audit.repository";
import { AuthRepository } from "../repositories/auth.repository";
import { AuthSessionsRepository } from "../repositories/auth-sessions.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { AuthService } from "../services/auth.service";

type AuthRouteOptions = {
  dataSource: DataSource;
};

export const authRoutes = async (
  app: FastifyInstance,
  options: AuthRouteOptions,
): Promise<void> => {
  const authController = new AuthController(
    new AuthService(
      options.dataSource,
      new AuthRepository(options.dataSource),
      new AuthSessionsRepository(options.dataSource),
      new OrganizationsRepository(options.dataSource),
      new AuditRepository(options.dataSource),
    ),
  );

  app.post(
    "/auth/sign-in",
    {
      preHandler: loginRateLimitMiddleware,
      schema: signInRouteSchema,
    },
    authController.signIn,
  );
  app.post("/auth/sign-up", { schema: authSignUpRouteSchema }, authController.signUp);
  app.post("/auth/refresh", { schema: refreshRouteSchema }, authController.refresh);
  app.get("/auth/me", { schema: authMeRouteSchema }, authController.me);
  app.patch("/auth/account", { schema: authUpdateAccountRouteSchema }, authController.updateAccount);
  app.patch("/auth/password", { schema: authUpdatePasswordRouteSchema }, authController.updatePassword);
  app.post(
    "/auth/forgot-password",
    {
      preHandler: forgotPasswordRateLimitMiddleware,
      schema: forgotPasswordRouteSchema,
    },
    authController.forgotPassword,
  );
};
