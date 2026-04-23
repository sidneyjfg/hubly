import type { FastifyReply, FastifyRequest } from "fastify";

import { AuditService } from "../services/audit.service";
import { getAuthUser } from "../utils/request-auth";

export class AuditController {
  public constructor(private readonly auditService: AuditService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.auditService.list(getAuthUser(request), query));
  };
}
