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

  public getRelationshipSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.notificationsService.getRelationshipSettings(getAuthUser(request)));
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

  public updateRelationshipSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      isEnabled?: boolean;
      campaigns?: Array<{
        id?: string;
        title?: string;
        type?: "promotion" | "loyalty";
        audience?: string;
        triggerDaysAfterLastBooking?: number;
        message?: string;
        channels?: Array<"whatsapp">;
        isEnabled?: boolean;
      }>;
    };

    reply.status(200).send(
      await this.notificationsService.updateRelationshipSettings(getAuthUser(request), {
        isEnabled: body.isEnabled ?? false,
        campaigns: (body.campaigns ?? []).map((item) => ({
          id: item.id ?? "",
          title: item.title ?? "",
          type: item.type ?? "promotion",
          audience: item.audience ?? "",
          triggerDaysAfterLastBooking: item.triggerDaysAfterLastBooking ?? 0,
          message: item.message ?? "",
          channels: item.channels ?? [],
          isEnabled: item.isEnabled ?? false,
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
