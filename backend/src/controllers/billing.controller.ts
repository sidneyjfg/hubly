import type { FastifyReply, FastifyRequest } from "fastify";

import { BillingService } from "../services/billing.service";
import { getAuthUser } from "../utils/request-auth";

export class BillingController {
  public constructor(private readonly billingService: BillingService) {}

  public getOrganizationSubscription = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.billingService.getOrganizationSubscription(getAuthUser(request)));
  };

  public changeOrganizationPlan = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.billingService.changeOrganizationPlan(getAuthUser(request), request.body));
  };

  public createSubscriptionCheckout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.billingService.createSubscriptionCheckout(getAuthUser(request), request.body));
  };

  public createSubscriptionCustomerPortal = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.billingService.createSubscriptionCustomerPortal(getAuthUser(request)));
  };

  public cancelOrganizationSubscription = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.billingService.cancelOrganizationSubscription(getAuthUser(request)));
  };
}
