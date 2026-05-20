import type { FastifyReply, FastifyRequest } from "fastify";

import { requestProtection } from "../security/request-protection";
import { SystemAdminService } from "../services/system-admin.service";
import { AppError } from "../utils/app-error";

export class SystemAdminController {
  public constructor(private readonly systemAdminService: SystemAdminService) {}

  public signIn = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      email?: string;
      password?: string;
    };
    const email = (body.email ?? "").toLowerCase();

    try {
      const session = await this.systemAdminService.signIn({
        email,
        password: body.password ?? "",
      });
      reply.status(200).send(session);
      void requestProtection.clearLoginFailures(request.ip || "unknown", email).catch(() => undefined);
      return;
    } catch (error: unknown) {
      if (error instanceof AppError && error.statusCode === 401) {
        await requestProtection.registerLoginFailure(request.ip || "unknown", email);
      }

      throw error;
    }
  };

  public listTenants = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.systemAdminService.listTenants(query));
  };

  public listAuditEvents = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as {
      action?: string;
      limit?: string;
      organizationId?: string;
      page?: string;
    };
    reply.status(200).send(await this.systemAdminService.listAuditEvents(query));
  };

  public getOperationalSummary = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.systemAdminService.getOperationalSummary());
  };

  public getSubscriptionReadiness = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.systemAdminService.getSubscriptionReadiness());
  };

  public listBillingPlans = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.systemAdminService.listBillingPlans());
  };

  public updateBillingPlan = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    reply.status(200).send(await this.systemAdminService.updateBillingPlan(params.id ?? "", request.body));
  };
}
