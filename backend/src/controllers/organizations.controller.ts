import type { FastifyReply, FastifyRequest } from "fastify";

import { OrganizationsService } from "../services/organizations.service";
import { getAuthUser } from "../utils/request-auth";

export class OrganizationsController {
  public constructor(private readonly organizationsService: OrganizationsService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.organizationsService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      legalName?: string;
      tradeName?: string;
      bookingPageSlug?: string;
      timezone?: string;
    };
    const input = {
      legalName: body.legalName ?? "",
      tradeName: body.tradeName ?? "",
      timezone: body.timezone ?? "",
      ...(body.bookingPageSlug === undefined ? {} : { bookingPageSlug: body.bookingPageSlug }),
    };

    reply.status(201).send(
      await this.organizationsService.create(input),
    );
  };

  public update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      legalName?: string;
      tradeName?: string;
      bookingPageSlug?: string;
      timezone?: string;
    };
    const input = {
      legalName: body.legalName ?? "",
      tradeName: body.tradeName ?? "",
      timezone: body.timezone ?? "",
      ...(body.bookingPageSlug === undefined ? {} : { bookingPageSlug: body.bookingPageSlug }),
    };

    reply.status(200).send(
      await this.organizationsService.update(getAuthUser(request), params.id ?? "", input),
    );
  };
}
