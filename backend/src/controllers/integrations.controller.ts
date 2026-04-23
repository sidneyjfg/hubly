import type { FastifyReply, FastifyRequest } from "fastify";

import { IntegrationsService } from "../services/integrations.service";
import { getAuthUser } from "../utils/request-auth";

export class IntegrationsController {
  public constructor(private readonly integrationsService: IntegrationsService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.integrationsService.list(getAuthUser(request)));
  };

  public whatsappStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.integrationsService.getWhatsAppStatus(getAuthUser(request)));
  };

  public whatsappConnect = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { number?: string };
    reply.status(200).send(await this.integrationsService.connectWhatsApp(getAuthUser(request), query.number));
  };

  public disconnectWhatsApp = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.integrationsService.disconnectWhatsApp(getAuthUser(request)));
  };

  public startWhatsAppSession = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as { phoneNumber?: string };

    reply.status(200).send(
      await this.integrationsService.startWhatsAppSession(getAuthUser(request), {
        phoneNumber: body.phoneNumber ?? "",
      }),
    );
  };

  public regenerateWhatsAppCode = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as { phoneNumber?: string };

    reply.status(200).send(
      await this.integrationsService.regenerateWhatsAppCode(getAuthUser(request), {
        phoneNumber: body.phoneNumber ?? "",
      }),
    );
  };

  public sendWhatsAppText = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      number?: string;
      text?: string;
    };

    reply.status(201).send(
      await this.integrationsService.sendWhatsAppText(getAuthUser(request), {
        number: body.number ?? "",
        text: body.text ?? "",
      }),
    );
  };
}
