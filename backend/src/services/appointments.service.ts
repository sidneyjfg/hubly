import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { AppointmentsRepository } from "../repositories/appointments.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { PatientsRepository } from "../repositories/patients.repository";
import { ProfessionalServicesRepository } from "../repositories/professional-services.repository";
import { ProfessionalsRepository } from "../repositories/professionals.repository";
import type {
  Appointment,
  AppointmentSchedule,
  AppointmentStatusUpdateInput,
  AppointmentWriteInput,
} from "../types/appointment";
import type { AuthenticatedRequestUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult } from "../utils/pagination";
import { NotificationsService } from "./notifications.service";

const appointmentWriteSchema = z.object({
  patientId: z.string().min(3),
  professionalId: z.string().min(3),
  serviceId: z.string().min(3).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().max(255).nullable().optional(),
});

const appointmentStatusNoteSchema = z.object({
  notes: z.string().max(255).nullable().optional(),
});

const dateLikeSchema = z.string().min(10).transform((value) => value.slice(0, 10)).pipe(z.string().date());

const scheduleDateSchema = z.object({
  date: dateLikeSchema,
  limit: z.union([z.string(), z.number()]).optional(),
  page: z.union([z.string(), z.number()]).optional(),
});

function parseSchedulePagination(data: { limit?: string | number | undefined; page?: string | number | undefined }) {
  return parsePagination({
    ...(data.limit === undefined ? {} : { limit: data.limit }),
    ...(data.page === undefined ? {} : { page: data.page }),
  });
}

const noShowPeriodSchema = z.object({
  from: dateLikeSchema,
  to: dateLikeSchema,
});

const cancellableStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);
const reschedulableStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);

const parseAppointmentWindow = (startsAt: string, endsAt: string): { startsAt: Date; endsAt: Date } => {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new AppError("appointments.invalid_window", "Invalid appointment window.", 400);
  }

  if (endDate.getTime() <= startDate.getTime()) {
    throw new AppError("appointments.invalid_window", "Appointment end must be after start.", 400);
  }

  return {
    startsAt: startDate,
    endsAt: endDate,
  };
};

const buildDailyScheduleRange = (date: string): { startDate: Date; endDate: Date; referenceDate: string } => {
  const startDate = new Date(`${date}T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return {
    startDate,
    endDate,
    referenceDate: startDate.toISOString(),
  };
};

const buildWeeklyScheduleRange = (date: string): { startDate: Date; endDate: Date; referenceDate: string } => {
  const reference = new Date(`${date}T00:00:00.000Z`);
  const dayOfWeek = reference.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const startDate = new Date(reference);
  startDate.setUTCDate(reference.getUTCDate() + offsetToMonday);

  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 7);

  return {
    startDate,
    endDate,
    referenceDate: reference.toISOString(),
  };
};

export class AppointmentsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly professionalsRepository: ProfessionalsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly notificationsService: NotificationsService,
    private readonly professionalServicesRepository?: ProfessionalServicesRepository,
  ) {}

  public async list(
    user: AuthenticatedRequestUser,
    filters: {
      from?: string;
      limit?: string;
      page?: string;
      to?: string;
    } = {},
  ): Promise<PaginatedResult<Appointment>> {
    const repositoryFilters: {
      from?: Date;
      to?: Date;
    } = {};

    if (filters.from) {
      repositoryFilters.from = new Date(filters.from);
    }

    if (filters.to) {
      repositoryFilters.to = new Date(filters.to);
    }

    return this.appointmentsRepository.findAll(user.clinicId, {
      ...repositoryFilters,
      pagination: parsePagination(filters),
    });
  }

  public async create(user: AuthenticatedRequestUser, input: AppointmentWriteInput): Promise<Appointment> {
    const data = appointmentWriteSchema.parse({
      ...input,
      notes: input.notes ?? null,
    });
    const { startsAt, endsAt } = parseAppointmentWindow(data.startsAt, data.endsAt);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      await this.ensureAppointmentRelations(user, data.patientId, data.professionalId, data.serviceId ?? null, manager);
      await this.assertNoConflict(user.clinicId, data.professionalId, startsAt, endsAt, manager);

      const appointment = await this.appointmentsRepository.create(
        {
          clinicId: user.clinicId,
          patientId: data.patientId,
          professionalId: data.professionalId,
          serviceId: data.serviceId ?? null,
          createdByUserId: user.id,
          status: "scheduled",
          startsAt,
          endsAt,
          notes: data.notes ?? null,
        },
        manager,
      );

      await this.auditRepository.create(
        {
          clinicId: user.clinicId,
          actorId: user.id,
          action: "appointment.created",
          targetType: "appointment",
          targetId: appointment.id,
        },
        manager,
      );

      await this.notificationsService.handleAppointmentEvent(
        user,
        {
          type: "appointment.created",
          appointment,
        },
        manager,
      );

      return appointment;
    });
  }

  public async cancel(
    user: AuthenticatedRequestUser,
    id: string,
    input: AppointmentStatusUpdateInput,
  ): Promise<Appointment> {
    const data = appointmentStatusNoteSchema.parse({
      notes: input.notes ?? null,
    });

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const appointment = await this.getAppointmentOrThrow(user.clinicId, id, manager);
      if (!cancellableStatuses.has(appointment.status)) {
        throw new AppError("appointments.invalid_status_transition", "Appointment cannot be cancelled.", 409);
      }

      const cancelledAppointment = await this.appointmentsRepository.updateInClinic(
        user.clinicId,
        id,
        {
          status: "cancelled",
          notes: data.notes ?? appointment.notes ?? null,
        },
        manager,
      );

      if (!cancelledAppointment) {
        throw new AppError("appointments.not_found", "Appointment not found.", 404);
      }

      await this.auditRepository.create(
        {
          clinicId: user.clinicId,
          actorId: user.id,
          action: "appointment.cancelled",
          targetType: "appointment",
          targetId: id,
        },
        manager,
      );

      await this.notificationsService.handleAppointmentEvent(
        user,
        {
          type: "appointment.cancelled",
          appointment: cancelledAppointment,
        },
        manager,
      );

      return cancelledAppointment;
    });
  }

  public async reschedule(
    user: AuthenticatedRequestUser,
    id: string,
    input: AppointmentWriteInput,
  ): Promise<Appointment> {
    const data = appointmentWriteSchema.parse({
      ...input,
      notes: input.notes ?? null,
    });
    const { startsAt, endsAt } = parseAppointmentWindow(data.startsAt, data.endsAt);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const currentAppointment = await this.getAppointmentOrThrow(user.clinicId, id, manager);
      if (!reschedulableStatuses.has(currentAppointment.status)) {
        throw new AppError("appointments.invalid_status_transition", "Appointment cannot be rescheduled.", 409);
      }

      await this.ensureAppointmentRelations(user, data.patientId, data.professionalId, data.serviceId ?? null, manager);
      await this.assertNoConflict(user.clinicId, data.professionalId, startsAt, endsAt, manager, id);

      const appointment = await this.appointmentsRepository.updateInClinic(
        user.clinicId,
        id,
        {
          patientId: data.patientId,
          professionalId: data.professionalId,
          serviceId: data.serviceId ?? null,
          status: "rescheduled",
          startsAt,
          endsAt,
          notes: data.notes ?? currentAppointment.notes ?? null,
        },
        manager,
      );

      if (!appointment) {
        throw new AppError("appointments.not_found", "Appointment not found.", 404);
      }

      await this.auditRepository.create(
        {
          clinicId: user.clinicId,
          actorId: user.id,
          action: "appointment.rescheduled",
          targetType: "appointment",
          targetId: id,
        },
        manager,
      );

      await this.notificationsService.handleAppointmentEvent(
        user,
        {
          type: "appointment.rescheduled",
          appointment,
        },
        manager,
      );

      return appointment;
    });
  }

  public async markAttended(
    user: AuthenticatedRequestUser,
    id: string,
    input: AppointmentStatusUpdateInput,
  ): Promise<Appointment> {
    return this.updateAttendanceStatus(user, id, "attended", input, "appointment.attended");
  }

  public async markMissed(
    user: AuthenticatedRequestUser,
    id: string,
    input: AppointmentStatusUpdateInput,
  ): Promise<Appointment> {
    return this.updateAttendanceStatus(user, id, "missed", input, "appointment.missed");
  }

  public async getDailySchedule(
    user: AuthenticatedRequestUser,
    query: string | { date?: string; limit?: string; page?: string },
  ): Promise<AppointmentSchedule & { limit: number; page: number; total: number; totalPages: number }> {
    const data = scheduleDateSchema.parse(typeof query === "string" ? { date: query } : query);
    const range = buildDailyScheduleRange(data.date);
    const pagination = parseSchedulePagination(data);

    const appointments = await this.appointmentsRepository.findAll(user.clinicId, {
      from: range.startDate,
      to: range.endDate,
      pagination,
    });

    return {
      referenceDate: range.referenceDate,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      items: appointments.items,
      limit: appointments.limit,
      page: appointments.page,
      total: appointments.total,
      totalPages: appointments.totalPages,
    };
  }

  public async getWeeklySchedule(
    user: AuthenticatedRequestUser,
    query: string | { date?: string; limit?: string; page?: string },
  ): Promise<AppointmentSchedule & { limit: number; page: number; total: number; totalPages: number }> {
    const data = scheduleDateSchema.parse(typeof query === "string" ? { date: query } : query);
    const range = buildWeeklyScheduleRange(data.date);
    const pagination = parseSchedulePagination(data);

    const appointments = await this.appointmentsRepository.findAll(user.clinicId, {
      from: range.startDate,
      to: range.endDate,
      pagination,
    });

    return {
      referenceDate: range.referenceDate,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      items: appointments.items,
      limit: appointments.limit,
      page: appointments.page,
      total: appointments.total,
      totalPages: appointments.totalPages,
    };
  }

  public async getNoShowOverview(
    user: AuthenticatedRequestUser,
    query: { from: string; to: string },
  ) {
    const data = noShowPeriodSchema.parse(query);
    const periodStart = new Date(`${data.from}T00:00:00.000Z`);
    const periodEnd = new Date(`${data.to}T00:00:00.000Z`);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 1);

    return this.appointmentsRepository.buildNoShowOverview(user.clinicId, periodStart, periodEnd);
  }

  private async updateAttendanceStatus(
    user: AuthenticatedRequestUser,
    id: string,
    status: "attended" | "missed",
    input: AppointmentStatusUpdateInput,
    auditAction: string,
  ): Promise<Appointment> {
    const data = appointmentStatusNoteSchema.parse({
      notes: input.notes ?? null,
    });

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      await this.getAppointmentOrThrow(user.clinicId, id, manager);

      const appointment = await this.appointmentsRepository.updateInClinic(
        user.clinicId,
        id,
        {
          status,
          ...(data.notes === undefined ? {} : { notes: data.notes }),
        },
        manager,
      );

      if (!appointment) {
        throw new AppError("appointments.not_found", "Appointment not found.", 404);
      }

      await this.auditRepository.create(
        {
          clinicId: user.clinicId,
          actorId: user.id,
          action: auditAction,
          targetType: "appointment",
          targetId: id,
        },
        manager,
      );

      await this.notificationsService.handleAppointmentEvent(
        user,
        {
          type: status === "attended" ? "appointment.attended" : "appointment.missed",
          appointment,
        },
        manager,
      );

      return appointment;
    });
  }

  private async getAppointmentOrThrow(
    clinicId: string,
    id: string,
    manager: EntityManager,
  ): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findByIdInClinic(clinicId, id, manager);
    if (!appointment) {
      throw new AppError("appointments.not_found", "Appointment not found.", 404);
    }

    return appointment;
  }

  private async ensureAppointmentRelations(
    user: AuthenticatedRequestUser,
    patientId: string,
    professionalId: string,
    serviceId: string | null,
    manager: EntityManager,
  ): Promise<void> {
    const [patient, professional] = await Promise.all([
      this.patientsRepository.findByIdInClinic(user.clinicId, patientId, manager),
      this.professionalsRepository.findByIdInClinic(user.clinicId, professionalId, manager),
    ]);

    if (!patient) {
      throw new AppError("patients.not_found", "Paciente não encontrado.", 404);
    }

    if (patient.isActive === false) {
      throw new AppError("patients.inactive", "Paciente inativo não pode receber novo agendamento.", 409);
    }

    if (!professional) {
      throw new AppError("professionals.not_found", "Profissional não encontrado.", 404);
    }

    if (!professional.isActive) {
      throw new AppError("professionals.inactive", "Profissional inativo não pode receber novo agendamento.", 409);
    }

    if (serviceId) {
      if (!this.professionalServicesRepository) {
        throw new AppError("professional_services.unavailable", "Catálogo de serviços indisponível.", 500);
      }

      const service = await this.professionalServicesRepository.findByIdInClinic(user.clinicId, serviceId, manager);

      if (!service) {
        throw new AppError("professional_services.not_found", "Serviço não encontrado.", 404);
      }

      if (service.professionalId !== professionalId) {
        throw new AppError("professional_services.invalid_professional", "Serviço não pertence ao profissional informado.", 409);
      }

      if (!service.isActive) {
        throw new AppError("professional_services.inactive", "Serviço inativo não pode ser usado no agendamento.", 409);
      }
    }
  }

  private async assertNoConflict(
    clinicId: string,
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
    manager: EntityManager,
    excludeId?: string,
  ): Promise<void> {
    const hasConflict = await this.appointmentsRepository.hasConflict(
      clinicId,
      professionalId,
      startsAt,
      endsAt,
      manager,
      excludeId,
    );

    if (hasConflict) {
      throw new AppError("appointments.time_conflict", "Professional already has an appointment in this time range.", 409);
    }
  }
}
