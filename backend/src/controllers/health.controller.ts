import type { FastifyReply, FastifyRequest } from "fastify";

export class HealthController {
  public check = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send({
      status: "ok",
    });
  };
}
