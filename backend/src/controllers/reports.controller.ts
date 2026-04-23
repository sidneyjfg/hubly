import type { FastifyReply, FastifyRequest } from "fastify";

import { ReportsService } from "../services/reports.service";
import { getAuthUser } from "../utils/request-auth";

export class ReportsController {
  public constructor(private readonly reportsService: ReportsService) {}

  public listCatalog = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.reportsService.listCatalog());
  };

  public noShowOverview = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { from?: string; to?: string };

    reply.status(200).send(
      await this.reportsService.getNoShowOverview(getAuthUser(request), {
        from: query.from ?? "",
        to: query.to ?? "",
      }),
    );
  };
}
