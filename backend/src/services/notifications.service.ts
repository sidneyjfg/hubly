import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { AppointmentsRepository } from "../repositories/appointments.repository";
import { AppointmentNotificationsRepository } from "../repositories/appointment-notifications.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { ClinicIntegrationsRepository } from "../repositories/clinic-integrations.repository";
import { ClinicNotificationSettingsRepository } from "../repositories/clinic-notification-settings.repository";
import { ClinicsRepository } from "../repositories/clinics.repository";
import { PatientsRepository } from "../repositories/patients.repository";
import type { Appointment } from "../types/appointment";
import type { AuthenticatedRequestUser } from "../types/auth";
import type {
  AppointmentNotification,
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

type AppointmentNotificationEvent =
  | { type: "appointment.created"; appointment: Appointment }
  | { type: "appointment.rescheduled"; appointment: Appointment }
  | { type: "appointment.cancelled"; appointment: Appointment }
  | { type: "appointment.attended"; appointment: Appointment }
  | { type: "appointment.missed"; appointment: Appointment };

const activeAppointmentStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);

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
    private readonly clinicNotificationSettingsRepository: ClinicNotificationSettingsRepository,
    private readonly appointmentNotificationsRepository: AppointmentNotificationsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly clinicsRepository: ClinicsRepository,
    private readonly clinicIntegrationsRepository: ClinicIntegrationsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly evolutionWhatsAppService: EvolutionWhatsAppService,
  ) {}

  public async listChannels(): Promise<{ items: readonly string[] }> {
    return {
      items: ["whatsapp", "email"] as const,
    };
  }

  public async getWhatsAppSettings(user: AuthenticatedRequestUser): Promise<WhatsAppReminderSettings> {
    return this.clinicNotificationSettingsRepository.findWhatsAppByClinic(user.clinicId);
  }

  public async updateWhatsAppSettings(
    user: AuthenticatedRequestUser,
    input: WhatsAppReminderSettingsInput,
  ): Promise<WhatsAppReminderSettings> {
    const data = whatsappReminderSettingsSchema.parse(input);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const settings = await this.clinicNotificationSettingsRepository.upsertWhatsAppSettings(
        {
          clinicId: user.clinicId,
          isEnabled: data.isEnabled,
          reminders: [...data.reminders].sort((left, right) => right.hoursBefore - left.hoursBefore),
        },
        manager,
      );

      await this.rebuildClinicWhatsAppReminders(user.clinicId, manager);

      await this.auditRepository.create(
        {
          clinicId: user.clinicId,
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

  public async handleAppointmentEvent(
    _user: AuthenticatedRequestUser,
    event: AppointmentNotificationEvent,
    manager: EntityManager,
  ): Promise<void> {
    if (event.type === "appointment.cancelled" || event.type === "appointment.attended" || event.type === "appointment.missed") {
      await this.appointmentNotificationsRepository.cancelPendingForAppointment(
        event.appointment.clinicId,
        event.appointment.id,
        manager,
      );
      return;
    }

    await this.syncWhatsAppRemindersForAppointment(event.appointment, manager);
  }

  public async processDueWhatsAppReminders(
    user: AuthenticatedRequestUser,
    input: { limit?: number } = {},
  ): Promise<ProcessDueNotificationsResult> {
    const data = processDueSchema.parse(input);
    const runAt = new Date();
    const limit = data.limit ?? 25;

    const dueNotifications = await this.appointmentNotificationsRepository.findDuePendingWhatsApp(
      user.clinicId,
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

    const integration = await this.clinicIntegrationsRepository.findByClinicAndChannel(user.clinicId, "whatsapp");

    if (!integration) {
      throw new AppError("notifications.whatsapp.integration_required", "WhatsApp integration must be configured first.", 409);
    }

    const processedItems: AppointmentNotification[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const notification of dueNotifications) {
      const lockedNotification = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
        const currentNotification = await this.appointmentNotificationsRepository.markAsProcessing(notification.id, manager);
        if (!currentNotification) {
          return null;
        }

        const appointment = await this.appointmentsRepository.findByIdInClinic(user.clinicId, notification.appointmentId, manager);
        if (!appointment || !activeAppointmentStatuses.has(appointment.status)) {
          await this.appointmentNotificationsRepository.markAsCancelled(notification.id, manager);

          return null;
        }

        return currentNotification;
      });

      if (!lockedNotification) {
        continue;
      }

      try {
        const sendResult = await this.evolutionWhatsAppService.sendText(integration.instanceName, {
          number: lockedNotification.patientPhone,
          text: lockedNotification.message,
        });

        const sentNotification = await this.appointmentNotificationsRepository.markAsSent(
          lockedNotification.id,
          extractExternalMessageId(sendResult as Record<string, unknown>),
        );
        processedItems.push(sentNotification);
        sentCount += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown WhatsApp delivery failure.";
        const failedNotification = await this.appointmentNotificationsRepository.markAsFailed(lockedNotification.id, message);
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

  public async processDueWhatsAppRemindersAcrossClinics(limit = 100): Promise<ProcessDueNotificationsResult> {
    const runAt = new Date();
    const dueNotifications = await this.appointmentNotificationsRepository.findDuePendingWhatsAppAcrossClinics(
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

    const processedItems: AppointmentNotification[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const notification of dueNotifications) {
      const lockedNotification = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
        const currentNotification = await this.appointmentNotificationsRepository.markAsProcessing(notification.id, manager);
        if (!currentNotification) {
          return null;
        }

        const appointment = await this.appointmentsRepository.findByIdInClinic(
          notification.clinicId,
          notification.appointmentId,
          manager,
        );
        if (!appointment || !activeAppointmentStatuses.has(appointment.status)) {
          await this.appointmentNotificationsRepository.markAsCancelled(notification.id, manager);

          return null;
        }

        return currentNotification;
      });

      if (!lockedNotification) {
        continue;
      }

      try {
        const integration = await this.clinicIntegrationsRepository.findByClinicAndChannel(
          lockedNotification.clinicId,
          "whatsapp",
        );

        if (!integration) {
          const failedNotification = await this.appointmentNotificationsRepository.markAsFailed(
            lockedNotification.id,
            "Integração de WhatsApp não configurada.",
          );
          processedItems.push(failedNotification);
          failedCount += 1;
          continue;
        }

        const sendResult = await this.evolutionWhatsAppService.sendText(integration.instanceName, {
          number: lockedNotification.patientPhone,
          text: lockedNotification.message,
        });

        const sentNotification = await this.appointmentNotificationsRepository.markAsSent(
          lockedNotification.id,
          extractExternalMessageId(sendResult as Record<string, unknown>),
        );
        processedItems.push(sentNotification);
        sentCount += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown WhatsApp delivery failure.";
        const failedNotification = await this.appointmentNotificationsRepository.markAsFailed(lockedNotification.id, message);
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

  private async rebuildClinicWhatsAppReminders(clinicId: string, manager: EntityManager): Promise<void> {
    const upcomingAppointments = await this.appointmentsRepository.findUpcomingActiveByClinic(clinicId, new Date(), manager);

    for (const appointment of upcomingAppointments) {
      await this.syncWhatsAppRemindersForAppointment(appointment, manager);
    }
  }

  private async syncWhatsAppRemindersForAppointment(
    appointment: Appointment,
    manager: EntityManager,
  ): Promise<void> {
    const settings = await this.clinicNotificationSettingsRepository.findWhatsAppByClinic(appointment.clinicId, manager);

    if (!settings.isEnabled || settings.reminders.length === 0) {
      await this.appointmentNotificationsRepository.cancelPendingForAppointment(
        appointment.clinicId,
        appointment.id,
        manager,
      );
      return;
    }

    const patient = await this.patientsRepository.findByIdInClinic(appointment.clinicId, appointment.patientId, manager);
    if (!patient) {
      throw new AppError("patients.not_found", "Patient not found.", 404);
    }

    const normalizedPhone = normalizePhoneNumber(patient.phone);
    if (!normalizedPhone) {
      await this.appointmentNotificationsRepository.cancelPendingForAppointment(
        appointment.clinicId,
        appointment.id,
        manager,
      );
      return;
    }

    const clinic = await this.clinicsRepository.findByIdInClinic(appointment.clinicId, appointment.clinicId, manager);
    const timezone = clinic?.timezone ?? "UTC";
    const startsAt = new Date(appointment.startsAt);
    const now = new Date();

    const reminders = settings.reminders
      .map((rule) => ({
        clinicId: appointment.clinicId,
        appointmentId: appointment.id,
        scheduledFor: new Date(startsAt.getTime() - (rule.hoursBefore * 60 * 60 * 1000)),
        hoursBefore: rule.hoursBefore,
        patientPhone: normalizedPhone,
        message: this.buildWhatsAppReminderMessage(appointment, timezone, rule.hoursBefore),
      }))
      .filter((reminder) => reminder.scheduledFor.getTime() > now.getTime());

    await this.appointmentNotificationsRepository.replacePendingForAppointment(
      appointment.clinicId,
      appointment.id,
      reminders,
      manager,
    );
  }

  private buildWhatsAppReminderMessage(
    appointment: Appointment,
    timezone: string,
    hoursBefore: number,
  ): string {
    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone,
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(appointment.startsAt));

    const leadTimeText = hoursBefore >= 24 && hoursBefore % 24 === 0
      ? `${hoursBefore / 24} dia${hoursBefore / 24 === 1 ? "" : "s"}`
      : `${hoursBefore} hora${hoursBefore === 1 ? "" : "s"}`;

    const patientName = appointment.patientName ?? "paciente";
    const professionalName = appointment.professionalName ?? "profissional";

    return `Olá, ${patientName}. Este é um lembrete de WhatsApp da sua consulta com ${professionalName} em ${formattedDate}. Envio programado com ${leadTimeText} de antecedência.`;
  }
}
