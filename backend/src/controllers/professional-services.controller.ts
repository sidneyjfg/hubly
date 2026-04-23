import type { FastifyReply, FastifyRequest } from "fastify";

import { ProfessionalServicesService } from "../services/professional-services.service";
import { getAuthUser } from "../utils/request-auth";

export class ProfessionalServicesController {
  public constructor(private readonly servicesService: ProfessionalServicesService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string; professionalId?: string };
    reply.status(200).send(await this.servicesService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      professionalId?: string;
      name?: string;
      durationMinutes?: number;
      priceCents?: number | null;
      isActive?: boolean;
    };

    reply.status(201).send(
      await this.servicesService.create(getAuthUser(request), {
        professionalId: body.professionalId ?? "",
        name: body.name ?? "",
        durationMinutes: body.durationMinutes ?? 0,
        priceCents: body.priceCents ?? null,
        ...(body.isActive === undefined ? {} : { isActive: body.isActive }),
      }),
    );
  };

  public update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      professionalId?: string;
      name?: string;
      durationMinutes?: number;
      priceCents?: number | null;
      isActive?: boolean;
    };

    reply.status(200).send(
      await this.servicesService.update(getAuthUser(request), params.id ?? "", {
        professionalId: body.professionalId ?? "",
        name: body.name ?? "",
        durationMinutes: body.durationMinutes ?? 0,
        priceCents: body.priceCents ?? null,
        ...(body.isActive === undefined ? {} : { isActive: body.isActive }),
      }),
    );
  };

  public setStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { isActive?: boolean };

    reply.status(200).send(
      await this.servicesService.setStatus(getAuthUser(request), params.id ?? "", body.isActive ?? false),
    );
  };
}
