import type { FastifyReply, FastifyRequest } from "fastify";

import { NotificationsService } from "../services/notifications.service";
import { getAuthUser } from "../utils/request-auth";

export class NotificationsController {
  public constructor(private readonly notificationsService: NotificationsService) {}

  public listChannels = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.notificationsService.listChannels());
  };

  public getWhatsAppSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.notificationsService.getWhatsAppSettings(getAuthUser(request)));
  };

  public updateWhatsAppSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      isEnabled?: boolean;
      reminders?: Array<{ hoursBefore?: number }>;
    };

    reply.status(200).send(
      await this.notificationsService.updateWhatsAppSettings(getAuthUser(request), {
        isEnabled: body.isEnabled ?? false,
        reminders: (body.reminders ?? []).map((item) => ({
          hoursBefore: item.hoursBefore ?? 0,
        })),
      }),
    );
  };

  public processDueWhatsApp = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as { limit?: number } | undefined;

    reply.status(200).send(
      await this.notificationsService.processDueWhatsAppReminders(
        getAuthUser(request),
        body?.limit === undefined ? {} : { limit: body.limit },
      ),
    );
  };
}
