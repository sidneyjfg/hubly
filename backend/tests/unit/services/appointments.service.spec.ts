import { describe, expect, it } from "vitest";

import { AppointmentsService } from "../../../src/services/appointments.service";
import type { NoShowOverview } from "../../../src/types/appointment";
import { AppError } from "../../../src/utils/app-error";

const authUser = {
  id: "usr_admin_001",
  clinicId: "cln_main_001",
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

describe("AppointmentsService", () => {
  it("returns appointments from repository", async () => {
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async findAll() {
          return {
            items: [
              {
                id: "apt_001",
                clinicId: "cln_main_001",
                patientId: "pat_001",
                professionalId: "pro_001",
                patientName: "Carlos Pereira",
                professionalName: "Dra. Ana Souza",
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
    );

    const result = await service.list(authUser);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.patientName).toBe("Carlos Pereira");
  });

  it("creates an appointment and records audit when there is no conflict", async () => {
    const handledEvents: string[] = [];
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async hasConflict() {
          return false;
        },
        async create(input: {
          clinicId: string;
          patientId: string;
          professionalId: string;
          createdByUserId: string;
          status: "scheduled";
          startsAt: Date;
          endsAt: Date;
          notes?: string | null;
        }) {
          return {
            id: "apt_new_001",
            clinicId: input.clinicId,
            patientId: input.patientId,
            professionalId: input.professionalId,
            createdByUserId: input.createdByUserId,
            patientName: "Carlos Pereira",
            professionalName: "Dra. Ana Souza",
            status: input.status,
            startsAt: input.startsAt.toISOString(),
            endsAt: input.endsAt.toISOString(),
            notes: input.notes ?? null,
          };
        },
      } as never,
      {
        async findByIdInClinic() {
          return {
            id: "pat_001",
            clinicId: "cln_main_001",
            fullName: "Carlos Pereira",
            phone: "+5511999999999",
          };
        },
      } as never,
      {
        async findByIdInClinic() {
          return {
            id: "pro_001",
            clinicId: "cln_main_001",
            fullName: "Dra. Ana Souza",
            specialty: "Clinica Geral",
            isActive: true,
          };
        },
      } as never,
      {
        async create() {},
      } as never,
      {
        async handleAppointmentEvent(
          _user: unknown,
          event: { type: string },
        ) {
          handledEvents.push(event.type);
        },
      } as never,
    );

    const result = await service.create(authUser, {
      patientId: "pat_001",
      professionalId: "pro_001",
      startsAt: "2026-04-21T12:00:00.000Z",
      endsAt: "2026-04-21T12:30:00.000Z",
      notes: "Primeira consulta",
    });

    expect(result.id).toBe("apt_new_001");
    expect(result.status).toBe("scheduled");
    expect(handledEvents).toEqual(["appointment.created"]);
  });

  it("rejects appointment creation when the professional has a conflicting slot", async () => {
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async hasConflict() {
          return true;
        },
      } as never,
      {
        async findByIdInClinic() {
          return {
            id: "pat_001",
            clinicId: "cln_main_001",
            fullName: "Carlos Pereira",
            phone: "+5511999999999",
          };
        },
      } as never,
      {
        async findByIdInClinic() {
          return {
            id: "pro_001",
            clinicId: "cln_main_001",
            fullName: "Dra. Ana Souza",
            specialty: "Clinica Geral",
            isActive: true,
          };
        },
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.create(authUser, {
        patientId: "pat_001",
        professionalId: "pro_001",
        startsAt: "2026-04-21T12:00:00.000Z",
        endsAt: "2026-04-21T12:30:00.000Z",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects appointment creation when the professional is inactive", async () => {
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async hasConflict() {
          return false;
        },
      } as never,
      {
        async findByIdInClinic() {
          return {
            id: "pat_001",
            clinicId: "cln_main_001",
            fullName: "Carlos Pereira",
            phone: "+5511999999999",
          };
        },
      } as never,
      {
        async findByIdInClinic() {
          return {
            id: "pro_001",
            clinicId: "cln_main_001",
            fullName: "Dra. Ana Souza",
            specialty: "Clinica Geral",
            isActive: false,
          };
        },
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.create(authUser, {
        patientId: "pat_001",
        professionalId: "pro_001",
        startsAt: "2026-04-21T12:00:00.000Z",
        endsAt: "2026-04-21T12:30:00.000Z",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("cancels appointments only from allowed statuses", async () => {
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async findByIdInClinic() {
          return {
            id: "apt_001",
            clinicId: "cln_main_001",
            patientId: "pat_001",
            professionalId: "pro_001",
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
    );

    await expect(
      service.cancel(authUser, "apt_001", {
        notes: "Paciente cancelou",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("marks appointment as attended", async () => {
    const handledEvents: string[] = [];
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async findByIdInClinic() {
          return {
            id: "apt_001",
            clinicId: "cln_main_001",
            patientId: "pat_001",
            professionalId: "pro_001",
            status: "scheduled",
            startsAt: "2026-04-21T12:00:00.000Z",
            endsAt: "2026-04-21T12:30:00.000Z",
            notes: null,
          };
        },
        async updateInClinic(
          _clinicId: string,
          id: string,
          input: { status?: "attended" | "missed" | "scheduled"; notes?: string | null },
        ) {
          return {
            id,
            clinicId: "cln_main_001",
            patientId: "pat_001",
            professionalId: "pro_001",
            status: input.status ?? "scheduled",
            startsAt: "2026-04-21T12:00:00.000Z",
            endsAt: "2026-04-21T12:30:00.000Z",
            notes: input.notes ?? null,
          };
        },
      } as never,
      {} as never,
      {} as never,
      {
        async create() {},
      } as never,
      {
        async handleAppointmentEvent(
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
    expect(handledEvents).toEqual(["appointment.attended"]);
  });

  it("returns the daily schedule for the selected date", async () => {
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async findAll(_clinicId: string, filters: { from?: Date; to?: Date }) {
          expect(filters.from?.toISOString()).toBe("2026-04-20T00:00:00.000Z");
          expect(filters.to?.toISOString()).toBe("2026-04-21T00:00:00.000Z");

          return {
            items: [
              {
                id: "apt_001",
                clinicId: "cln_main_001",
                patientId: "pat_001",
                professionalId: "pro_001",
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
    );

    const result = await service.getDailySchedule(authUser, "2026-04-20");

    expect(result.items).toHaveLength(1);
    expect(result.referenceDate).toBe("2026-04-20T00:00:00.000Z");
  });

  it("returns no-show overview for the selected period", async () => {
    const service = new AppointmentsService(
      transactionDataSource as never,
      {
        async buildNoShowOverview(
          clinicId: string,
          periodStart: Date,
          periodEnd: Date,
        ): Promise<NoShowOverview> {
          expect(clinicId).toBe("cln_main_001");
          expect(periodStart.toISOString()).toBe("2026-04-18T00:00:00.000Z");
          expect(periodEnd.toISOString()).toBe("2026-04-21T00:00:00.000Z");

          return {
            clinicId,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            totalAppointments: 4,
            attendedAppointments: 3,
            missedAppointments: 1,
            noShowRate: 0.25,
          };
        },
      } as never,
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
    expect(result.missedAppointments).toBe(1);
  });
});
