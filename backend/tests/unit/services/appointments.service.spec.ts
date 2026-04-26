import { describe, expect, it } from "vitest";

import { BookingsService } from "../../../src/services/bookings.service";
import type { NoShowOverview } from "../../../src/types/booking";
import { AppError } from "../../../src/utils/app-error";

const authUser = {
  id: "usr_admin_001",
  organizationId: "cln_main_001",
  role: "administrator" as const,
  sessionId: "sess_001",
};

const transactionDataSource = {
  async transaction(
    _isolationLevel: string,
    callback: (manager: unknown) => Promise<unknown>,
  ) {
    return callback({} as never);
  },
};

const availabilityRepository = {
  async findByProviderAndWeekdayInOrganization() {
    return {
      id: "avl_001",
      organizationId: "cln_main_001",
      providerId: "pro_001",
      weekday: 2,
      workStart: "08:00",
      workEnd: "18:00",
      lunchStart: "12:30",
      lunchEnd: "13:00",
      isActive: true,
    };
  },
};

describe("BookingsService", () => {
  it("returns bookings from repository", async () => {
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async findAll() {
          return {
            items: [
              {
                id: "apt_001",
                organizationId: "cln_main_001",
                customerId: "pat_001",
                providerId: "pro_001",
                customerName: "Carlos Pereira",
                providerName: "Dra. Ana Souza",
                status: "scheduled",
                startsAt: "2026-04-20T12:00:00.000Z",
                endsAt: "2026-04-20T12:30:00.000Z",
                notes: "Retorno",
              },
            ],
            limit: 20,
            page: 1,
            total: 1,
            totalPages: 1,
          };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.list(authUser);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.customerName).toBe("Carlos Pereira");
  });

  it("creates an booking and records audit when there is no conflict", async () => {
    const handledEvents: string[] = [];
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async hasConflict() {
          return false;
        },
        async create(input: {
          organizationId: string;
          customerId: string;
          providerId: string;
          createdByUserId: string;
          status: "scheduled";
          startsAt: Date;
          endsAt: Date;
          notes?: string | null;
        }) {
          return {
            id: "apt_new_001",
            organizationId: input.organizationId,
            customerId: input.customerId,
            providerId: input.providerId,
            createdByUserId: input.createdByUserId,
            customerName: "Carlos Pereira",
            providerName: "Dra. Ana Souza",
            status: input.status,
            startsAt: input.startsAt.toISOString(),
            endsAt: input.endsAt.toISOString(),
            notes: input.notes ?? null,
          };
        },
      } as never,
      {
        async findByIdInOrganization() {
          return {
            id: "pat_001",
            organizationId: "cln_main_001",
            fullName: "Carlos Pereira",
            phone: "+5511999999999",
          };
        },
      } as never,
      {
        async findByIdInOrganization() {
          return {
            id: "pro_001",
            organizationId: "cln_main_001",
            fullName: "Dra. Ana Souza",
            specialty: "Organizationa Geral",
            isActive: true,
          };
        },
      } as never,
      availabilityRepository as never,
      {
        async create() {},
      } as never,
      {
        async handleBookingEvent(
          _user: unknown,
          event: { type: string },
        ) {
          handledEvents.push(event.type);
        },
      } as never,
    );

    const result = await service.create(authUser, {
      customerId: "pat_001",
      providerId: "pro_001",
      startsAt: "2026-04-21T12:00:00.000Z",
      endsAt: "2026-04-21T12:30:00.000Z",
      notes: "Primeira consulta",
    });

    expect(result.id).toBe("apt_new_001");
    expect(result.status).toBe("scheduled");
    expect(handledEvents).toEqual(["booking.created"]);
  });

  it("rejects booking creation when the provider has a conflicting slot", async () => {
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async hasConflict() {
          return true;
        },
      } as never,
      {
        async findByIdInOrganization() {
          return {
            id: "pat_001",
            organizationId: "cln_main_001",
            fullName: "Carlos Pereira",
            phone: "+5511999999999",
          };
        },
      } as never,
      {
        async findByIdInOrganization() {
          return {
            id: "pro_001",
            organizationId: "cln_main_001",
            fullName: "Dra. Ana Souza",
            specialty: "Organizationa Geral",
            isActive: true,
          };
        },
      } as never,
      availabilityRepository as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.create(authUser, {
        customerId: "pat_001",
        providerId: "pro_001",
        startsAt: "2026-04-21T12:00:00.000Z",
        endsAt: "2026-04-21T12:30:00.000Z",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects booking creation when the provider is inactive", async () => {
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async hasConflict() {
          return false;
        },
      } as never,
      {
        async findByIdInOrganization() {
          return {
            id: "pat_001",
            organizationId: "cln_main_001",
            fullName: "Carlos Pereira",
            phone: "+5511999999999",
          };
        },
      } as never,
      {
        async findByIdInOrganization() {
          return {
            id: "pro_001",
            organizationId: "cln_main_001",
            fullName: "Dra. Ana Souza",
            specialty: "Organizationa Geral",
            isActive: false,
          };
        },
      } as never,
      availabilityRepository as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.create(authUser, {
        customerId: "pat_001",
        providerId: "pro_001",
        startsAt: "2026-04-21T12:00:00.000Z",
        endsAt: "2026-04-21T12:30:00.000Z",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("cancels bookings only from allowed statuses", async () => {
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async findByIdInOrganization() {
          return {
            id: "apt_001",
            organizationId: "cln_main_001",
            customerId: "pat_001",
            providerId: "pro_001",
            status: "cancelled",
            startsAt: "2026-04-21T12:00:00.000Z",
            endsAt: "2026-04-21T12:30:00.000Z",
            notes: null,
          };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.cancel(authUser, "apt_001", {
        notes: "Paciente cancelou",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("marks booking as attended", async () => {
    const handledEvents: string[] = [];
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async findByIdInOrganization() {
          return {
            id: "apt_001",
            organizationId: "cln_main_001",
            customerId: "pat_001",
            providerId: "pro_001",
            status: "scheduled",
            startsAt: "2026-04-21T12:00:00.000Z",
            endsAt: "2026-04-21T12:30:00.000Z",
            notes: null,
          };
        },
        async updateInOrganization(
          _organizationId: string,
          id: string,
          input: { status?: "attended" | "missed" | "scheduled"; notes?: string | null },
        ) {
          return {
            id,
            organizationId: "cln_main_001",
            customerId: "pat_001",
            providerId: "pro_001",
            status: input.status ?? "scheduled",
            startsAt: "2026-04-21T12:00:00.000Z",
            endsAt: "2026-04-21T12:30:00.000Z",
            notes: input.notes ?? null,
          };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {
        async create() {},
      } as never,
      {
        async handleBookingEvent(
          _user: unknown,
          event: { type: string },
        ) {
          handledEvents.push(event.type);
        },
      } as never,
    );

    const result = await service.markAttended(authUser, "apt_001", {
      notes: "Paciente compareceu",
    });

    expect(result.status).toBe("attended");
    expect(handledEvents).toEqual(["booking.attended"]);
  });

  it("returns the daily schedule for the selected date", async () => {
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async findAll(_organizationId: string, filters: { from?: Date; to?: Date }) {
          expect(filters.from?.toISOString()).toBe("2026-04-20T00:00:00.000Z");
          expect(filters.to?.toISOString()).toBe("2026-04-21T00:00:00.000Z");

          return {
            items: [
              {
                id: "apt_001",
                organizationId: "cln_main_001",
                customerId: "pat_001",
                providerId: "pro_001",
                status: "scheduled",
                startsAt: "2026-04-20T09:00:00.000Z",
                endsAt: "2026-04-20T09:30:00.000Z",
                notes: null,
              },
            ],
            limit: 100,
            page: 1,
            total: 1,
            totalPages: 1,
          };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.getDailySchedule(authUser, "2026-04-20");

    expect(result.items).toHaveLength(1);
    expect(result.referenceDate).toBe("2026-04-20T00:00:00.000Z");
  });

  it("returns no-show overview for the selected period", async () => {
    const service = new BookingsService(
      transactionDataSource as never,
      {
        async buildNoShowOverview(
          organizationId: string,
          periodStart: Date,
          periodEnd: Date,
        ): Promise<NoShowOverview> {
          expect(organizationId).toBe("cln_main_001");
          expect(periodStart.toISOString()).toBe("2026-04-18T00:00:00.000Z");
          expect(periodEnd.toISOString()).toBe("2026-04-21T00:00:00.000Z");

          return {
            organizationId,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            totalBookings: 4,
            attendedBookings: 3,
            missedBookings: 1,
            noShowRate: 0.25,
          };
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.getNoShowOverview(authUser, {
      from: "2026-04-18",
      to: "2026-04-20",
    });

    expect(result.noShowRate).toBe(0.25);
    expect(result.missedBookings).toBe(1);
  });
});
