import type { FastifyReply, FastifyRequest } from "fastify";

import { PaymentsService } from "../services/payments.service";
import { getAuthUser } from "../utils/request-auth";

export class PaymentsController {
  public constructor(private readonly paymentsService: PaymentsService) {}

  public getOrganizationSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.getOrganizationSettings(getAuthUser(request)));
  };

  public updateOrganizationSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.updateOrganizationSettings(getAuthUser(request), request.body));
  };

  public createOrganizationMercadoPagoConnectUrl = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.createOrganizationMercadoPagoConnectUrl(getAuthUser(request)));
  };

  public getProviderSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(await this.paymentsService.getProviderSettings(getAuthUser(request), params.providerId ?? ""));
  };

  public updateProviderSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(
      await this.paymentsService.updateProviderSettings(getAuthUser(request), params.providerId ?? "", request.body),
    );
  };

  public createMercadoPagoConnectUrl = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(
      await this.paymentsService.createMercadoPagoConnectUrl(getAuthUser(request), params.providerId ?? ""),
    );
  };

  public handleMercadoPagoOAuthCallback = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.handleMercadoPagoOAuthCallback(request.query));
  };

  public handleMercadoPagoWebhook = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { bookingId?: string; type?: string };
    const body = request.body as {
      type?: string;
      action?: string;
      data?: {
        id?: string | number;
      };
      resource?: string;
    };

    const webhookInput = {
      ...(query.bookingId === undefined ? {} : { bookingId: query.bookingId }),
      ...((body.type ?? query.type ?? body.action) === undefined ? {} : { eventType: body.type ?? query.type ?? body.action }),
      ...(body.data?.id === undefined ? {} : { paymentId: String(body.data.id) }),
      payload: body,
      ...(request.headers["x-signature"] === undefined ? {} : { signature: request.headers["x-signature"].toString() }),
      ...(request.headers["x-request-id"] === undefined ? {} : { requestId: request.headers["x-request-id"].toString() }),
    };

    reply.status(200).send(await this.paymentsService.handleMercadoPagoWebhook(webhookInput));
  };
}
