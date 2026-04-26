import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { BookingNotificationEntity } from "../database/entities";
import type {
  BookingNotification,
  BookingNotificationStatus,
  WhatsAppReminderRule,
} from "../types/notification";

type CreatePendingWhatsAppNotificationInput = {
  organizationId: string;
  bookingId: string;
  scheduledFor: Date;
  hoursBefore: number;
  customerPhone: string;
  message: string;
};

const mapNotification = (item: BookingNotificationEntity): BookingNotification => ({
  id: item.id,
  organizationId: item.organizationId,
  bookingId: item.bookingId,
  channel: "whatsapp",
  status: item.status as BookingNotificationStatus,
  scheduledFor: item.scheduledFor.toISOString(),
  sentAt: item.sentAt?.toISOString() ?? null,
  cancelledAt: item.cancelledAt?.toISOString() ?? null,
  failedAt: item.failedAt?.toISOString() ?? null,
  hoursBefore: item.hoursBefore,
  customerPhone: item.customerPhone,
  message: item.message,
  externalMessageId: item.externalMessageId,
  lastError: item.lastError,
});

export class BookingNotificationsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(BookingNotificationEntity);
  }

  public async replacePendingForBooking(
    organizationId: string,
    bookingId: string,
    reminders: CreatePendingWhatsAppNotificationInput[],
    manager: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);

    await repository.update(
      {
        organizationId,
        bookingId,
        channel: "whatsapp",
        status: "pending",
      },
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    );

    if (reminders.length === 0) {
      return;
    }

    await repository.save(
      reminders.map((reminder) => ({
        id: randomUUID(),
        organizationId: reminder.organizationId,
        bookingId: reminder.bookingId,
        channel: "whatsapp",
        status: "pending",
        scheduledFor: reminder.scheduledFor,
        hoursBefore: reminder.hoursBefore,
        customerPhone: reminder.customerPhone,
        message: reminder.message,
      })),
    );
  }

  public async cancelPendingForBooking(
    organizationId: string,
    bookingId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.getRepository(manager).update(
      {
        organizationId,
        bookingId,
        channel: "whatsapp",
        status: "pending",
      },
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    );
  }

  public async markAsCancelled(id: string, manager?: EntityManager): Promise<BookingNotification> {
    const repository = this.getRepository(manager);
    const item = await repository.findOneOrFail({ where: { id } });
    item.status = "cancelled";
    item.cancelledAt = new Date();
    item.lastError = null;

    return mapNotification(await repository.save(item));
  }

  public async findDuePendingWhatsApp(
    organizationId: string,
    runAt: Date,
    limit: number,
    manager?: EntityManager,
  ): Promise<BookingNotification[]> {
    const items = await this.getRepository(manager).find({
      where: {
        organizationId,
        channel: "whatsapp",
        status: "pending",
      },
      order: {
        scheduledFor: "ASC",
      },
      take: limit,
    });

    return items
      .filter((item) => item.scheduledFor.getTime() <= runAt.getTime())
      .map(mapNotification);
  }

  public async findDuePendingWhatsAppAcrossOrganizations(
    runAt: Date,
    limit: number,
    manager?: EntityManager,
  ): Promise<BookingNotification[]> {
    const items = await this.getRepository(manager).find({
      where: {
        channel: "whatsapp",
        status: "pending",
      },
      order: {
        scheduledFor: "ASC",
      },
      take: limit,
    });

    return items
      .filter((item) => item.scheduledFor.getTime() <= runAt.getTime())
      .map(mapNotification);
  }

  public async markAsProcessing(id: string, manager: EntityManager): Promise<BookingNotification | null> {
    const repository = this.getRepository(manager);
    const item = await repository.findOne({
      where: {
        id,
        status: "pending",
      },
    });

    if (!item) {
      return null;
    }

    item.status = "processing";
    const savedItem = await repository.save(item);
    return mapNotification(savedItem);
  }

  public async markAsSent(
    id: string,
    externalMessageId: string | null,
    manager?: EntityManager,
  ): Promise<BookingNotification> {
    const repository = this.getRepository(manager);
    const item = await repository.findOneOrFail({ where: { id } });
    item.status = "sent";
    item.sentAt = new Date();
    item.externalMessageId = externalMessageId;
    item.lastError = null;
    item.failedAt = null;

    return mapNotification(await repository.save(item));
  }

  public async markAsFailed(id: string, lastError: string, manager?: EntityManager): Promise<BookingNotification> {
    const repository = this.getRepository(manager);
    const item = await repository.findOneOrFail({ where: { id } });
    item.status = "failed";
    item.failedAt = new Date();
    item.lastError = lastError.slice(0, 255);

    return mapNotification(await repository.save(item));
  }

  public async listByBooking(
    organizationId: string,
    bookingId: string,
    manager?: EntityManager,
  ): Promise<BookingNotification[]> {
    const items = await this.getRepository(manager).find({
      where: {
        organizationId,
        bookingId,
      },
      order: {
        scheduledFor: "ASC",
      },
    });

    return items.map(mapNotification);
  }
}
