import type { FastifyReply, FastifyRequest } from "fastify";

import { ProfessionalsService } from "../services/professionals.service";
import { getAuthUser } from "../utils/request-auth";

export class ProfessionalsController {
  public constructor(private readonly professionalsService: ProfessionalsService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.professionalsService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      fullName?: string;
      specialty?: string;
      isActive?: boolean;
    };
    const input = {
      fullName: body.fullName ?? "",
      specialty: body.specialty ?? "",
      ...(body.isActive === undefined ? {} : { isActive: body.isActive }),
    };

    reply.status(201).send(
      await this.professionalsService.create(getAuthUser(request), input),
    );
  };

  public update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      fullName?: string;
      specialty?: string;
      isActive?: boolean;
    };
    const input = {
      fullName: body.fullName ?? "",
      specialty: body.specialty ?? "",
      ...(body.isActive === undefined ? {} : { isActive: body.isActive }),
    };

    reply.status(200).send(
      await this.professionalsService.update(getAuthUser(request), params.id ?? "", input),
    );
  };

  public setStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { isActive?: boolean };

    reply.status(200).send(
      await this.professionalsService.setStatus(getAuthUser(request), params.id ?? "", body.isActive ?? false),
    );
  };
}
