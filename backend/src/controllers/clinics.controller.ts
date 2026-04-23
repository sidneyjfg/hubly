import type { FastifyReply, FastifyRequest } from "fastify";

import { ClinicsService } from "../services/clinics.service";
import { getAuthUser } from "../utils/request-auth";

export class ClinicsController {
  public constructor(private readonly clinicsService: ClinicsService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.clinicsService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      legalName?: string;
      tradeName?: string;
      timezone?: string;
    };

    reply.status(201).send(
      await this.clinicsService.create({
        legalName: body.legalName ?? "",
        tradeName: body.tradeName ?? "",
        timezone: body.timezone ?? "",
      }),
    );
  };

  public update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      legalName?: string;
      tradeName?: string;
      timezone?: string;
    };

    reply.status(200).send(
      await this.clinicsService.update(getAuthUser(request), params.id ?? "", {
        legalName: body.legalName ?? "",
        tradeName: body.tradeName ?? "",
        timezone: body.timezone ?? "",
      }),
    );
  };
}
