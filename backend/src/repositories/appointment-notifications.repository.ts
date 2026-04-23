import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { AppointmentNotificationEntity } from "../database/entities";
import type {
  AppointmentNotification,
  AppointmentNotificationStatus,
  WhatsAppReminderRule,
} from "../types/notification";

type CreatePendingWhatsAppNotificationInput = {
  clinicId: string;
  appointmentId: string;
  scheduledFor: Date;
  hoursBefore: number;
  patientPhone: string;
  message: string;
};

const mapNotification = (item: AppointmentNotificationEntity): AppointmentNotification => ({
  id: item.id,
  clinicId: item.clinicId,
  appointmentId: item.appointmentId,
  channel: "whatsapp",
  status: item.status as AppointmentNotificationStatus,
  scheduledFor: item.scheduledFor.toISOString(),
  sentAt: item.sentAt?.toISOString() ?? null,
  cancelledAt: item.cancelledAt?.toISOString() ?? null,
  failedAt: item.failedAt?.toISOString() ?? null,
  hoursBefore: item.hoursBefore,
  patientPhone: item.patientPhone,
  message: item.message,
  externalMessageId: item.externalMessageId,
  lastError: item.lastError,
});

export class AppointmentNotificationsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(AppointmentNotificationEntity);
  }

  public async replacePendingForAppointment(
    clinicId: string,
    appointmentId: string,
    reminders: CreatePendingWhatsAppNotificationInput[],
    manager: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);

    await repository.update(
      {
        clinicId,
        appointmentId,
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
        clinicId: reminder.clinicId,
        appointmentId: reminder.appointmentId,
        channel: "whatsapp",
        status: "pending",
        scheduledFor: reminder.scheduledFor,
        hoursBefore: reminder.hoursBefore,
        patientPhone: reminder.patientPhone,
        message: reminder.message,
      })),
    );
  }

  public async cancelPendingForAppointment(
    clinicId: string,
    appointmentId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.getRepository(manager).update(
      {
        clinicId,
        appointmentId,
        channel: "whatsapp",
        status: "pending",
      },
      {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    );
  }

  public async markAsCancelled(id: string, manager?: EntityManager): Promise<AppointmentNotification> {
    const repository = this.getRepository(manager);
    const item = await repository.findOneOrFail({ where: { id } });
    item.status = "cancelled";
    item.cancelledAt = new Date();
    item.lastError = null;

    return mapNotification(await repository.save(item));
  }

  public async findDuePendingWhatsApp(
    clinicId: string,
    runAt: Date,
    limit: number,
    manager?: EntityManager,
  ): Promise<AppointmentNotification[]> {
    const items = await this.getRepository(manager).find({
      where: {
        clinicId,
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

  public async findDuePendingWhatsAppAcrossClinics(
    runAt: Date,
    limit: number,
    manager?: EntityManager,
  ): Promise<AppointmentNotification[]> {
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

  public async markAsProcessing(id: string, manager: EntityManager): Promise<AppointmentNotification | null> {
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
  ): Promise<AppointmentNotification> {
    const repository = this.getRepository(manager);
    const item = await repository.findOneOrFail({ where: { id } });
    item.status = "sent";
    item.sentAt = new Date();
    item.externalMessageId = externalMessageId;
    item.lastError = null;
    item.failedAt = null;

    return mapNotification(await repository.save(item));
  }

  public async markAsFailed(id: string, lastError: string, manager?: EntityManager): Promise<AppointmentNotification> {
    const repository = this.getRepository(manager);
    const item = await repository.findOneOrFail({ where: { id } });
    item.status = "failed";
    item.failedAt = new Date();
    item.lastError = lastError.slice(0, 255);

    return mapNotification(await repository.save(item));
  }

  public async listByAppointment(
    clinicId: string,
    appointmentId: string,
    manager?: EntityManager,
  ): Promise<AppointmentNotification[]> {
    const items = await this.getRepository(manager).find({
      where: {
        clinicId,
        appointmentId,
      },
      order: {
        scheduledFor: "ASC",
      },
    });

    return items.map(mapNotification);
  }
}
