import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthService } from "../services/auth.service";
import { getAuthUser } from "../utils/request-auth";
import { AppError } from "../utils/app-error";
import { requestProtection } from "../security/request-protection";

export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  public signIn = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      email?: string;
      password?: string;
    };

    const email = (body.email ?? "").toLowerCase();

    try {
      const result = await this.authService.signIn({
        email,
        password: body.password ?? "",
      });

      await requestProtection.clearLoginFailures(request.ip || "unknown", email);
      reply.status(200).send(result);
      return;
    } catch (error: unknown) {
      if (error instanceof AppError && error.statusCode === 401) {
        await requestProtection.registerLoginFailure(request.ip || "unknown", email);
      }

      throw error;
    }
  };

  public refresh = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      refreshToken?: string;
    };

    const result = await this.authService.refresh({
      refreshToken: body.refreshToken ?? "",
    });

    reply.status(200).send(result);
  };

  public signUp = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      organization?: {
        legalName?: string;
        tradeName?: string;
        timezone?: string;
      };
    };

    const result = await this.authService.signUp({
      fullName: body.fullName ?? "",
      email: (body.email ?? "").toLowerCase(),
      phone: body.phone ?? "",
      password: body.password ?? "",
      organization: {
        legalName: body.organization?.legalName ?? "",
        tradeName: body.organization?.tradeName ?? "",
        timezone: body.organization?.timezone ?? "",
      },
    });

    reply.status(201).send(result);
  };

  public me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authUser = getAuthUser(request);
    reply.status(200).send(await this.authService.me(authUser.id, authUser.organizationId));
  };

  public updateAccount = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authUser = getAuthUser(request);
    const body = request.body as {
      fullName?: string;
      email?: string;
      phone?: string;
    };

    reply.status(200).send(
      await this.authService.updateAccount(authUser.id, authUser.organizationId, {
        fullName: body.fullName ?? "",
        email: (body.email ?? "").toLowerCase(),
        phone: body.phone ?? "",
      }),
    );
  };

  public updatePassword = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authUser = getAuthUser(request);
    const body = request.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    reply.status(200).send(
      await this.authService.updatePassword(authUser.id, authUser.organizationId, authUser.sessionId, {
        currentPassword: body.currentPassword ?? "",
        newPassword: body.newPassword ?? "",
      }),
    );
  };

  public forgotPassword = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      email?: string;
    };

    const result = await this.authService.forgotPassword({
      email: (body.email ?? "").toLowerCase(),
    });

    reply.status(202).send(result);
  };
}
