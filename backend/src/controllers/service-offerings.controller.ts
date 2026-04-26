import type { FastifyReply, FastifyRequest } from "fastify";

import { ServiceOfferingsService } from "../services/service-offerings.service";
import { getAuthUser } from "../utils/request-auth";

export class ServiceOfferingsController {
  public constructor(private readonly servicesService: ServiceOfferingsService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string; providerId?: string };
    reply.status(200).send(await this.servicesService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      providerId?: string;
      name?: string;
      durationMinutes?: number;
      priceCents?: number | null;
      isActive?: boolean;
    };

    reply.status(201).send(
      await this.servicesService.create(getAuthUser(request), {
        providerId: body.providerId ?? "",
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
      providerId?: string;
      name?: string;
      durationMinutes?: number;
      priceCents?: number | null;
      isActive?: boolean;
    };

    reply.status(200).send(
      await this.servicesService.update(getAuthUser(request), params.id ?? "", {
        providerId: body.providerId ?? "",
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
