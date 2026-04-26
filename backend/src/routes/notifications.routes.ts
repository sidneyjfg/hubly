import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { NotificationsController } from "../controllers/notifications.controller";
import {
  notificationsChannelsRouteSchema,
  notificationsProcessDueWhatsAppRouteSchema,
  notificationsWhatsAppSettingsGetRouteSchema,
  notificationsWhatsAppSettingsUpdateRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { createNotificationsService } from "../services/notifications.factory";

type NotificationsRouteOptions = {
  dataSource: DataSource;
};

export const notificationsRoutes = async (
  app: FastifyInstance,
  options: NotificationsRouteOptions,
): Promise<void> => {
  const notificationsController = new NotificationsController(createNotificationsService(options.dataSource));

  app.get(
    "/notifications/channels",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: notificationsChannelsRouteSchema,
    },
    notificationsController.listChannels,
  );

  app.get(
    "/notifications/whatsapp/settings",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: notificationsWhatsAppSettingsGetRouteSchema,
    },
    notificationsController.getWhatsAppSettings,
  );

  app.put(
    "/notifications/whatsapp/settings",
    {
      preHandler: [
        allowRoles(["administrator"]),
        criticalRouteRateLimitMiddleware("notifications:whatsapp:settings"),
      ],
      schema: notificationsWhatsAppSettingsUpdateRouteSchema,
    },
    notificationsController.updateWhatsAppSettings,
  );

  app.post(
    "/notifications/whatsapp/process",
    {
      preHandler: [
        allowRoles(["administrator"]),
        criticalRouteRateLimitMiddleware("notifications:whatsapp:process"),
      ],
      schema: notificationsProcessDueWhatsAppRouteSchema,
    },
    notificationsController.processDueWhatsApp,
  );
};
