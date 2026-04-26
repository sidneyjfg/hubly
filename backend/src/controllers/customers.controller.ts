import type { FastifyReply, FastifyRequest } from "fastify";

import { CustomersService } from "../services/customers.service";
import { getAuthUser } from "../utils/request-auth";

export class CustomersController {
  public constructor(private readonly customersService: CustomersService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.customersService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      fullName?: string;
      email?: string | null;
      phone?: string;
    };

    reply.status(201).send(
      await this.customersService.create(getAuthUser(request), {
        fullName: body.fullName ?? "",
        email: body.email ?? null,
        phone: body.phone ?? "",
      }),
    );
  };

  public update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      fullName?: string;
      email?: string | null;
      phone?: string;
    };

    reply.status(200).send(
      await this.customersService.update(getAuthUser(request), params.id ?? "", {
        fullName: body.fullName ?? "",
        email: body.email ?? null,
        phone: body.phone ?? "",
      }),
    );
  };

  public setStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { isActive?: boolean };

    reply.status(200).send(
      await this.customersService.setStatus(getAuthUser(request), params.id ?? "", body.isActive ?? false),
    );
  };
}
