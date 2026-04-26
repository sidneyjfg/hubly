import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { BookingsRepository } from "../repositories/bookings.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import type {
  Booking,
  BookingSchedule,
  BookingStatusUpdateInput,
  BookingWriteInput,
} from "../types/booking";
import type { AuthenticatedRequestUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult } from "../utils/pagination";
import { isWithinProviderAvailability } from "../utils/provider-availability";
import { NotificationsService } from "./notifications.service";

const bookingWriteSchema = z.object({
  customerId: z.string().min(3),
  providerId: z.string().min(3),
  offeringId: z.string().min(3).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().max(255).nullable().optional(),
});

const bookingStatusNoteSchema = z.object({
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

const parseBookingWindow = (startsAt: string, endsAt: string): { startsAt: Date; endsAt: Date } => {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new AppError("bookings.invalid_window", "Invalid booking window.", 400);
  }

  if (endDate.getTime() <= startDate.getTime()) {
    throw new AppError("bookings.invalid_window", "Booking end must be after start.", 400);
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

export class BookingsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly bookingsRepository: BookingsRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly providersRepository: ProvidersRepository,
    private readonly providerAvailabilitiesRepository: ProviderAvailabilitiesRepository,
    private readonly auditRepository: AuditRepository,
    private readonly notificationsService: NotificationsService,
    private readonly providerServicesRepository?: ServiceOfferingsRepository,
  ) {}

  public async list(
    user: AuthenticatedRequestUser,
    filters: {
      from?: string;
      limit?: string;
      page?: string;
      to?: string;
    } = {},
  ): Promise<PaginatedResult<Booking>> {
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

    return this.bookingsRepository.findAll(user.organizationId, {
      ...repositoryFilters,
      pagination: parsePagination(filters),
    });
  }

  public async create(user: AuthenticatedRequestUser, input: BookingWriteInput): Promise<Booking> {
    const data = bookingWriteSchema.parse({
      ...input,
      notes: input.notes ?? null,
    });
    const { startsAt, endsAt } = parseBookingWindow(data.startsAt, data.endsAt);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      await this.ensureBookingRelations(user, data.customerId, data.providerId, data.offeringId ?? null, manager);
      await this.assertWithinProviderAvailability(user.organizationId, data.providerId, startsAt, endsAt, manager);
      await this.assertNoConflict(user.organizationId, data.providerId, startsAt, endsAt, manager);

      const booking = await this.bookingsRepository.create(
        {
          organizationId: user.organizationId,
          customerId: data.customerId,
          providerId: data.providerId,
          offeringId: data.offeringId ?? null,
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
          organizationId: user.organizationId,
          actorId: user.id,
          action: "booking.created",
          targetType: "booking",
          targetId: booking.id,
        },
        manager,
      );

      await this.notificationsService.handleBookingEvent(
        user,
        {
          type: "booking.created",
          booking,
        },
        manager,
      );

      return booking;
    });
  }

  public async cancel(
    user: AuthenticatedRequestUser,
    id: string,
    input: BookingStatusUpdateInput,
  ): Promise<Booking> {
    const data = bookingStatusNoteSchema.parse({
      notes: input.notes ?? null,
    });

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const booking = await this.getBookingOrThrow(user.organizationId, id, manager);
      if (!cancellableStatuses.has(booking.status)) {
        throw new AppError("bookings.invalid_status_transition", "Booking cannot be cancelled.", 409);
      }

      const cancelledBooking = await this.bookingsRepository.updateInOrganization(
        user.organizationId,
        id,
        {
          status: "cancelled",
          notes: data.notes ?? booking.notes ?? null,
        },
        manager,
      );

      if (!cancelledBooking) {
        throw new AppError("bookings.not_found", "Booking not found.", 404);
      }

      await this.auditRepository.create(
        {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "booking.cancelled",
          targetType: "booking",
          targetId: id,
        },
        manager,
      );

      await this.notificationsService.handleBookingEvent(
        user,
        {
          type: "booking.cancelled",
          booking: cancelledBooking,
        },
        manager,
      );

      return cancelledBooking;
    });
  }

  public async reschedule(
    user: AuthenticatedRequestUser,
    id: string,
    input: BookingWriteInput,
  ): Promise<Booking> {
    const data = bookingWriteSchema.parse({
      ...input,
      notes: input.notes ?? null,
    });
    const { startsAt, endsAt } = parseBookingWindow(data.startsAt, data.endsAt);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const currentBooking = await this.getBookingOrThrow(user.organizationId, id, manager);
      if (!reschedulableStatuses.has(currentBooking.status)) {
        throw new AppError("bookings.invalid_status_transition", "Booking cannot be rescheduled.", 409);
      }

      await this.ensureBookingRelations(user, data.customerId, data.providerId, data.offeringId ?? null, manager);
      await this.assertWithinProviderAvailability(user.organizationId, data.providerId, startsAt, endsAt, manager);
      await this.assertNoConflict(user.organizationId, data.providerId, startsAt, endsAt, manager, id);

      const booking = await this.bookingsRepository.updateInOrganization(
        user.organizationId,
        id,
        {
          customerId: data.customerId,
          providerId: data.providerId,
          offeringId: data.offeringId ?? null,
          status: "rescheduled",
          startsAt,
          endsAt,
          notes: data.notes ?? currentBooking.notes ?? null,
        },
        manager,
      );

      if (!booking) {
        throw new AppError("bookings.not_found", "Booking not found.", 404);
      }

      await this.auditRepository.create(
        {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "booking.rescheduled",
          targetType: "booking",
          targetId: id,
        },
        manager,
      );

      await this.notificationsService.handleBookingEvent(
        user,
        {
          type: "booking.rescheduled",
          booking,
        },
        manager,
      );

      return booking;
    });
  }

  public async markAttended(
    user: AuthenticatedRequestUser,
    id: string,
    input: BookingStatusUpdateInput,
  ): Promise<Booking> {
    return this.updateAttendanceStatus(user, id, "attended", input, "booking.attended");
  }

  public async markMissed(
    user: AuthenticatedRequestUser,
    id: string,
    input: BookingStatusUpdateInput,
  ): Promise<Booking> {
    return this.updateAttendanceStatus(user, id, "missed", input, "booking.missed");
  }

  public async getDailySchedule(
    user: AuthenticatedRequestUser,
    query: string | { date?: string; limit?: string; page?: string },
  ): Promise<BookingSchedule & { limit: number; page: number; total: number; totalPages: number }> {
    const data = scheduleDateSchema.parse(typeof query === "string" ? { date: query } : query);
    const range = buildDailyScheduleRange(data.date);
    const pagination = parseSchedulePagination(data);

    const bookings = await this.bookingsRepository.findAll(user.organizationId, {
      from: range.startDate,
      to: range.endDate,
      pagination,
    });

    return {
      referenceDate: range.referenceDate,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      items: bookings.items,
      limit: bookings.limit,
      page: bookings.page,
      total: bookings.total,
      totalPages: bookings.totalPages,
    };
  }

  public async getWeeklySchedule(
    user: AuthenticatedRequestUser,
    query: string | { date?: string; limit?: string; page?: string },
  ): Promise<BookingSchedule & { limit: number; page: number; total: number; totalPages: number }> {
    const data = scheduleDateSchema.parse(typeof query === "string" ? { date: query } : query);
    const range = buildWeeklyScheduleRange(data.date);
    const pagination = parseSchedulePagination(data);

    const bookings = await this.bookingsRepository.findAll(user.organizationId, {
      from: range.startDate,
      to: range.endDate,
      pagination,
    });

    return {
      referenceDate: range.referenceDate,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      items: bookings.items,
      limit: bookings.limit,
      page: bookings.page,
      total: bookings.total,
      totalPages: bookings.totalPages,
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

    return this.bookingsRepository.buildNoShowOverview(user.organizationId, periodStart, periodEnd);
  }

  private async updateAttendanceStatus(
    user: AuthenticatedRequestUser,
    id: string,
    status: "attended" | "missed",
    input: BookingStatusUpdateInput,
    auditAction: string,
  ): Promise<Booking> {
    const data = bookingStatusNoteSchema.parse({
      notes: input.notes ?? null,
    });

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      await this.getBookingOrThrow(user.organizationId, id, manager);

      const booking = await this.bookingsRepository.updateInOrganization(
        user.organizationId,
        id,
        {
          status,
          ...(data.notes === undefined ? {} : { notes: data.notes }),
        },
        manager,
      );

      if (!booking) {
        throw new AppError("bookings.not_found", "Booking not found.", 404);
      }

      await this.auditRepository.create(
        {
          organizationId: user.organizationId,
          actorId: user.id,
          action: auditAction,
          targetType: "booking",
          targetId: id,
        },
        manager,
      );

      await this.notificationsService.handleBookingEvent(
        user,
        {
          type: status === "attended" ? "booking.attended" : "booking.missed",
          booking,
        },
        manager,
      );

      return booking;
    });
  }

  private async getBookingOrThrow(
    organizationId: string,
    id: string,
    manager: EntityManager,
  ): Promise<Booking> {
    const booking = await this.bookingsRepository.findByIdInOrganization(organizationId, id, manager);
    if (!booking) {
      throw new AppError("bookings.not_found", "Booking not found.", 404);
    }

    return booking;
  }

  private async ensureBookingRelations(
    user: AuthenticatedRequestUser,
    customerId: string,
    providerId: string,
    offeringId: string | null,
    manager: EntityManager,
  ): Promise<void> {
    const [customer, provider] = await Promise.all([
      this.customersRepository.findByIdInOrganization(user.organizationId, customerId, manager),
      this.providersRepository.findByIdInOrganization(user.organizationId, providerId, manager),
    ]);

    if (!customer) {
      throw new AppError("customers.not_found", "Paciente não encontrado.", 404);
    }

    if (customer.isActive === false) {
      throw new AppError("customers.inactive", "Paciente inativo não pode receber novo agendamento.", 409);
    }

    if (!provider) {
      throw new AppError("providers.not_found", "Profissional não encontrado.", 404);
    }

    if (!provider.isActive) {
      throw new AppError("providers.inactive", "Profissional inativo não pode receber novo agendamento.", 409);
    }

    if (offeringId) {
      if (!this.providerServicesRepository) {
        throw new AppError("provider_services.unavailable", "Catálogo de serviços indisponível.", 500);
      }

      const service = await this.providerServicesRepository.findByIdInOrganization(user.organizationId, offeringId, manager);

      if (!service) {
        throw new AppError("provider_services.not_found", "Serviço não encontrado.", 404);
      }

      if (service.providerId !== providerId) {
        throw new AppError("provider_services.invalid_provider", "Serviço não pertence ao profissional informado.", 409);
      }

      if (!service.isActive) {
        throw new AppError("provider_services.inactive", "Serviço inativo não pode ser usado no agendamento.", 409);
      }
    }
  }

  private async assertNoConflict(
    organizationId: string,
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    manager: EntityManager,
    excludeId?: string,
  ): Promise<void> {
    const hasConflict = await this.bookingsRepository.hasConflict(
      organizationId,
      providerId,
      startsAt,
      endsAt,
      manager,
      excludeId,
    );

    if (hasConflict) {
      throw new AppError("bookings.time_conflict", "Provider already has an booking in this time range.", 409);
    }
  }

  private async assertWithinProviderAvailability(
    organizationId: string,
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    manager: EntityManager,
  ): Promise<void> {
    const weekday = startsAt.getUTCDay();
    const availability = await this.providerAvailabilitiesRepository.findByProviderAndWeekdayInOrganization(
      organizationId,
      providerId,
      weekday,
      manager,
    );

    if (!availability || !isWithinProviderAvailability(availability, startsAt, endsAt)) {
      throw new AppError("bookings.outside_provider_availability", "Booking is outside provider working hours.", 409);
    }
  }
}
