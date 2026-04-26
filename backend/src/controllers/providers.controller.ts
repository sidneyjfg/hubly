import type { FastifyReply, FastifyRequest } from "fastify";

import { ProvidersService } from "../services/providers.service";
import { getAuthUser } from "../utils/request-auth";

export class ProvidersController {
  public constructor(private readonly providersService: ProvidersService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.providersService.list(getAuthUser(request), query));
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
      await this.providersService.create(getAuthUser(request), input),
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
      await this.providersService.update(getAuthUser(request), params.id ?? "", input),
    );
  };

  public setStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { isActive?: boolean };

    reply.status(200).send(
      await this.providersService.setStatus(getAuthUser(request), params.id ?? "", body.isActive ?? false),
    );
  };

  public listAvailability = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    reply.status(200).send(await this.providersService.listAvailability(getAuthUser(request), params.id ?? ""));
  };

  public replaceAvailability = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as Array<{
      weekday?: number;
      workStart?: string;
      workEnd?: string;
      lunchStart?: string | null;
      lunchEnd?: string | null;
      isActive?: boolean;
    }>;

    reply.status(200).send(
      await this.providersService.replaceAvailability(
        getAuthUser(request),
        params.id ?? "",
        (body ?? []).map((item) => ({
          weekday: item.weekday ?? 0,
          workStart: item.workStart ?? "",
          workEnd: item.workEnd ?? "",
          ...(item.lunchStart === undefined ? {} : { lunchStart: item.lunchStart }),
          ...(item.lunchEnd === undefined ? {} : { lunchEnd: item.lunchEnd }),
          ...(item.isActive === undefined ? {} : { isActive: item.isActive }),
        })),
      ),
    );
  };
}
