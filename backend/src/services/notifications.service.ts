import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { BookingsRepository } from "../repositories/bookings.repository";
import { BookingNotificationsRepository } from "../repositories/booking-notifications.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import type { Booking } from "../types/booking";
import type { AuthenticatedRequestUser } from "../types/auth";
import type {
  BookingNotification,
  ProcessDueNotificationsResult,
  WhatsAppReminderSettings,
  WhatsAppReminderSettingsInput,
} from "../types/notification";
import { AppError } from "../utils/app-error";
import { EvolutionWhatsAppService } from "./evolution-whatsapp.service";

const whatsappReminderRuleSchema = z.object({
  hoursBefore: z.number().int().min(1).max(24 * 30),
});

const whatsappReminderSettingsSchema = z.object({
  isEnabled: z.boolean(),
  reminders: z.array(whatsappReminderRuleSchema).max(10),
}).superRefine((value, context) => {
  const seenHours = new Set<number>();

  for (const reminder of value.reminders) {
    if (seenHours.has(reminder.hoursBefore)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reminder offsets must be unique.",
        path: ["reminders"],
      });
      return;
    }

    seenHours.add(reminder.hoursBefore);
  }

  if (value.isEnabled && value.reminders.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one reminder is required when WhatsApp reminders are enabled.",
      path: ["reminders"],
    });
  }
});

const processDueSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

type BookingNotificationEvent =
  | { type: "booking.created"; booking: Booking }
  | { type: "booking.rescheduled"; booking: Booking }
  | { type: "booking.cancelled"; booking: Booking }
  | { type: "booking.attended"; booking: Booking }
  | { type: "booking.missed"; booking: Booking };

const activeBookingStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);

const normalizePhoneNumber = (value: string): string => value.replace(/\D+/g, "");

const extractExternalMessageId = (payload: Record<string, unknown>): string | null => {
  const keyCandidates = ["key", "id"];

  for (const key of keyCandidates) {
    const value = payload[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
};

export class NotificationsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationNotificationSettingsRepository: OrganizationNotificationSettingsRepository,
    private readonly bookingNotificationsRepository: BookingNotificationsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly organizationIntegrationsRepository: OrganizationIntegrationsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly evolutionWhatsAppService: EvolutionWhatsAppService,
  ) {}

  public async listChannels(): Promise<{ items: readonly string[] }> {
    return {
      items: ["whatsapp", "email"] as const,
    };
  }

  public async getWhatsAppSettings(user: AuthenticatedRequestUser): Promise<WhatsAppReminderSettings> {
    return this.organizationNotificationSettingsRepository.findWhatsAppByOrganization(user.organizationId);
  }

  public async updateWhatsAppSettings(
    user: AuthenticatedRequestUser,
    input: WhatsAppReminderSettingsInput,
  ): Promise<WhatsAppReminderSettings> {
    const data = whatsappReminderSettingsSchema.parse(input);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const settings = await this.organizationNotificationSettingsRepository.upsertWhatsAppSettings(
        {
          organizationId: user.organizationId,
          isEnabled: data.isEnabled,
          reminders: [...data.reminders].sort((left, right) => right.hoursBefore - left.hoursBefore),
        },
        manager,
      );

      await this.rebuildOrganizationWhatsAppReminders(user.organizationId, manager);

      await this.auditRepository.create(
        {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "notification.whatsapp.settings_updated",
          targetType: "notification_setting",
          targetId: "whatsapp",
        },
        manager,
      );

      return settings;
    });
  }

  public async handleBookingEvent(
    _user: AuthenticatedRequestUser,
    event: BookingNotificationEvent,
    manager: EntityManager,
  ): Promise<void> {
    if (event.type === "booking.cancelled" || event.type === "booking.attended" || event.type === "booking.missed") {
      await this.bookingNotificationsRepository.cancelPendingForBooking(
        event.booking.organizationId,
        event.booking.id,
        manager,
      );
      return;
    }

    await this.syncWhatsAppRemindersForBooking(event.booking, manager);
  }

  public async processDueWhatsAppReminders(
    user: AuthenticatedRequestUser,
    input: { limit?: number } = {},
  ): Promise<ProcessDueNotificationsResult> {
    const data = processDueSchema.parse(input);
    const runAt = new Date();
    const limit = data.limit ?? 25;

    const dueNotifications = await this.bookingNotificationsRepository.findDuePendingWhatsApp(
      user.organizationId,
      runAt,
      limit,
    );

    if (dueNotifications.length === 0) {
      return {
        processedCount: 0,
        sentCount: 0,
        failedCount: 0,
        items: [],
      };
    }

    const integration = await this.organizationIntegrationsRepository.findByOrganizationAndChannel(user.organizationId, "whatsapp");

    if (!integration) {
      throw new AppError("notifications.whatsapp.integration_required", "WhatsApp integration must be configured first.", 409);
    }

    const processedItems: BookingNotification[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const notification of dueNotifications) {
      const lockedNotification = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
        const currentNotification = await this.bookingNotificationsRepository.markAsProcessing(notification.id, manager);
        if (!currentNotification) {
          return null;
        }

        const booking = await this.bookingsRepository.findByIdInOrganization(user.organizationId, notification.bookingId, manager);
        if (!booking || !activeBookingStatuses.has(booking.status)) {
          await this.bookingNotificationsRepository.markAsCancelled(notification.id, manager);

          return null;
        }

        return currentNotification;
      });

      if (!lockedNotification) {
        continue;
      }

      try {
        const sendResult = await this.evolutionWhatsAppService.sendText(integration.instanceName, {
          number: lockedNotification.customerPhone,
          text: lockedNotification.message,
        });

        const sentNotification = await this.bookingNotificationsRepository.markAsSent(
          lockedNotification.id,
          extractExternalMessageId(sendResult as Record<string, unknown>),
        );
        processedItems.push(sentNotification);
        sentCount += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown WhatsApp delivery failure.";
        const failedNotification = await this.bookingNotificationsRepository.markAsFailed(lockedNotification.id, message);
        processedItems.push(failedNotification);
        failedCount += 1;
      }
    }

    return {
      processedCount: processedItems.length,
      sentCount,
      failedCount,
      items: processedItems,
    };
  }

  public async processDueWhatsAppRemindersAcrossOrganizations(limit = 100): Promise<ProcessDueNotificationsResult> {
    const runAt = new Date();
    const dueNotifications = await this.bookingNotificationsRepository.findDuePendingWhatsAppAcrossOrganizations(
      runAt,
      limit,
    );

    if (dueNotifications.length === 0) {
      return {
        processedCount: 0,
        sentCount: 0,
        failedCount: 0,
        items: [],
      };
    }

    const processedItems: BookingNotification[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const notification of dueNotifications) {
      const lockedNotification = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
        const currentNotification = await this.bookingNotificationsRepository.markAsProcessing(notification.id, manager);
        if (!currentNotification) {
          return null;
        }

        const booking = await this.bookingsRepository.findByIdInOrganization(
          notification.organizationId,
          notification.bookingId,
          manager,
        );
        if (!booking || !activeBookingStatuses.has(booking.status)) {
          await this.bookingNotificationsRepository.markAsCancelled(notification.id, manager);

          return null;
        }

        return currentNotification;
      });

      if (!lockedNotification) {
        continue;
      }

      try {
        const integration = await this.organizationIntegrationsRepository.findByOrganizationAndChannel(
          lockedNotification.organizationId,
          "whatsapp",
        );

        if (!integration) {
          const failedNotification = await this.bookingNotificationsRepository.markAsFailed(
            lockedNotification.id,
            "Integração de WhatsApp não configurada.",
          );
          processedItems.push(failedNotification);
          failedCount += 1;
          continue;
        }

        const sendResult = await this.evolutionWhatsAppService.sendText(integration.instanceName, {
          number: lockedNotification.customerPhone,
          text: lockedNotification.message,
        });

        const sentNotification = await this.bookingNotificationsRepository.markAsSent(
          lockedNotification.id,
          extractExternalMessageId(sendResult as Record<string, unknown>),
        );
        processedItems.push(sentNotification);
        sentCount += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown WhatsApp delivery failure.";
        const failedNotification = await this.bookingNotificationsRepository.markAsFailed(lockedNotification.id, message);
        processedItems.push(failedNotification);
        failedCount += 1;
      }
    }

    return {
      processedCount: processedItems.length,
      sentCount,
      failedCount,
      items: processedItems,
    };
  }

  private async rebuildOrganizationWhatsAppReminders(organizationId: string, manager: EntityManager): Promise<void> {
    const upcomingBookings = await this.bookingsRepository.findUpcomingActiveByOrganization(organizationId, new Date(), manager);

    for (const booking of upcomingBookings) {
      await this.syncWhatsAppRemindersForBooking(booking, manager);
    }
  }

  private async syncWhatsAppRemindersForBooking(
    booking: Booking,
    manager: EntityManager,
  ): Promise<void> {
    const settings = await this.organizationNotificationSettingsRepository.findWhatsAppByOrganization(booking.organizationId, manager);

    if (!settings.isEnabled || settings.reminders.length === 0) {
      await this.bookingNotificationsRepository.cancelPendingForBooking(
        booking.organizationId,
        booking.id,
        manager,
      );
      return;
    }

    const customer = await this.customersRepository.findByIdInOrganization(booking.organizationId, booking.customerId, manager);
    if (!customer) {
      throw new AppError("customers.not_found", "Customer not found.", 404);
    }

    const normalizedPhone = normalizePhoneNumber(customer.phone);
    if (!normalizedPhone) {
      await this.bookingNotificationsRepository.cancelPendingForBooking(
        booking.organizationId,
        booking.id,
        manager,
      );
      return;
    }

    const organization = await this.organizationsRepository.findByIdInOrganization(booking.organizationId, booking.organizationId, manager);
    const timezone = organization?.timezone ?? "UTC";
    const startsAt = new Date(booking.startsAt);
    const now = new Date();

    const reminders = settings.reminders
      .map((rule) => ({
        organizationId: booking.organizationId,
        bookingId: booking.id,
        scheduledFor: new Date(startsAt.getTime() - (rule.hoursBefore * 60 * 60 * 1000)),
        hoursBefore: rule.hoursBefore,
        customerPhone: normalizedPhone,
        message: this.buildWhatsAppReminderMessage(booking, timezone, rule.hoursBefore),
      }))
      .filter((reminder) => reminder.scheduledFor.getTime() > now.getTime());

    await this.bookingNotificationsRepository.replacePendingForBooking(
      booking.organizationId,
      booking.id,
      reminders,
      manager,
    );
  }

  private buildWhatsAppReminderMessage(
    booking: Booking,
    timezone: string,
    hoursBefore: number,
  ): string {
    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone,
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(booking.startsAt));

    const leadTimeText = hoursBefore >= 24 && hoursBefore % 24 === 0
      ? `${hoursBefore / 24} dia${hoursBefore / 24 === 1 ? "" : "s"}`
      : `${hoursBefore} hora${hoursBefore === 1 ? "" : "s"}`;

    const customerName = booking.customerName ?? "paciente";
    const providerName = booking.providerName ?? "profissional";

    return `Olá, ${customerName}. Este é um lembrete de WhatsApp da sua consulta com ${providerName} em ${formattedDate}. Envio programado com ${leadTimeText} de antecedência.`;
  }
}
