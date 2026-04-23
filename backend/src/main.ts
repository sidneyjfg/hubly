import "reflect-metadata";

import { buildApp } from "./app";
import { initializeAppDataSource } from "./database/data-source";
import { createNotificationsService } from "./services/notifications.factory";
import { closeRedisClient } from "./utils/redis";
import { env } from "./utils/env";

const bootstrap = async (): Promise<void> => {
  const dataSource = await initializeAppDataSource();
  const notificationsService = createNotificationsService(dataSource);
  const app = buildApp({
    dataSource,
  });
  const reminderIntervalMs = 60 * 1000;
  const reminderTimer = setInterval(async () => {
    try {
      const result = await notificationsService.processDueWhatsAppRemindersAcrossClinics();

      if (result.processedCount > 0) {
        app.log.info(
          {
            failedCount: result.failedCount,
            processedCount: result.processedCount,
            sentCount: result.sentCount,
          },
          "Processed due WhatsApp reminders",
        );
      }
    } catch (error: unknown) {
      app.log.error(error, "Failed to process due WhatsApp reminders");
    }
  }, reminderIntervalMs);

  app.addHook("onClose", async () => {
    clearInterval(reminderTimer);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    await closeRedisClient();
  });

  await app.listen({
    host: env.HTTP_HOST,
    port: env.HTTP_PORT,
  });
};

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
