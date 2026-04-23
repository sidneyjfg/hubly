import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager, Not } from "typeorm";

import { AppointmentEntity } from "../database/entities";
import type { Appointment, AppointmentStatus, NoShowOverview } from "../types/appointment";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class AppointmentsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(AppointmentEntity);
  }

  private mapAppointment(appointment: AppointmentEntity): Appointment {
    return {
      id: appointment.id,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      createdByUserId: appointment.createdByUserId,
      patientName: appointment.patient?.fullName,
      professionalName: appointment.professional?.fullName,
      serviceName: appointment.service?.name ?? null,
      status: appointment.status as Appointment["status"],
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      notes: appointment.notes,
    };
  }

  public async findAll(
    clinicId: string,
    filters: {
      from?: Date;
      to?: Date;
      pagination?: Pagination;
    } = {},
  ): Promise<PaginatedResult<Appointment>> {
    const query = this.getRepository().createQueryBuilder("appointment")
      .leftJoinAndSelect("appointment.patient", "patient")
      .leftJoinAndSelect("appointment.professional", "professional")
      .leftJoinAndSelect("appointment.service", "service")
      .where("appointment.clinicId = :clinicId", { clinicId });

    if (filters.from) {
      query.andWhere("appointment.startsAt >= :from", { from: filters.from });
    }

    if (filters.to) {
      query.andWhere("appointment.startsAt < :to", { to: filters.to });
    }

    const pagination = filters.pagination ?? { page: 1, limit: 100 };
    const [appointments, total] = await query
      .orderBy("appointment.startsAt", "ASC")
      .skip(getPaginationOffset(pagination))
      .take(pagination.limit)
      .getManyAndCount();

    return buildPaginatedResult(appointments.map((appointment) => this.mapAppointment(appointment)), total, pagination);
  }

  public async findUpcomingActiveByClinic(
    clinicId: string,
    from: Date,
    manager?: EntityManager,
  ): Promise<Appointment[]> {
    const appointments = await this.getRepository(manager).createQueryBuilder("appointment")
      .leftJoinAndSelect("appointment.patient", "patient")
      .leftJoinAndSelect("appointment.professional", "professional")
      .where("appointment.clinicId = :clinicId", { clinicId })
      .andWhere("appointment.startsAt > :from", { from })
      .andWhere("appointment.status IN (:...statuses)", {
        statuses: ["scheduled", "confirmed", "rescheduled"],
      })
      .orderBy("appointment.startsAt", "ASC")
      .getMany();

    return appointments.map((appointment) => this.mapAppointment(appointment));
  }

  public async findByIdInClinic(
    clinicId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<Appointment | null> {
    const appointment = await this.getRepository(manager).findOne({
      where: {
        id,
        clinicId,
      },
      relations: {
        patient: true,
        professional: true,
        service: true,
      },
    });

    return appointment ? this.mapAppointment(appointment) : null;
  }

  public async create(
    input: {
      clinicId: string;
      patientId: string;
      professionalId: string;
      serviceId?: string | null;
      createdByUserId: string;
      status: AppointmentStatus;
      startsAt: Date;
      endsAt: Date;
      notes?: string | null;
    },
    manager: EntityManager,
  ): Promise<Appointment> {
    const appointment = await this.getRepository(manager).save({
      id: randomUUID(),
      clinicId: input.clinicId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      serviceId: input.serviceId ?? null,
      createdByUserId: input.createdByUserId,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes ?? null,
    });

    const savedAppointment = await this.getRepository(manager).findOneOrFail({
      where: {
        id: appointment.id,
        clinicId: input.clinicId,
      },
      relations: {
        patient: true,
        professional: true,
        service: true,
      },
    });

    return this.mapAppointment(savedAppointment);
  }

  public async updateInClinic(
    clinicId: string,
    id: string,
    input: {
      patientId?: string;
      professionalId?: string;
      serviceId?: string | null;
      status?: AppointmentStatus;
      startsAt?: Date;
      endsAt?: Date;
      notes?: string | null;
    },
    manager: EntityManager,
  ): Promise<Appointment | null> {
    const repository = this.getRepository(manager);
    const appointment = await repository.findOne({
      where: {
        id,
        clinicId,
      },
      relations: {
        patient: true,
        professional: true,
      },
    });

    if (!appointment) {
      return null;
    }

    appointment.patientId = input.patientId ?? appointment.patientId;
    appointment.professionalId = input.professionalId ?? appointment.professionalId;
    appointment.serviceId = input.serviceId === undefined ? appointment.serviceId : input.serviceId;
    appointment.status = input.status ?? appointment.status;
    appointment.startsAt = input.startsAt ?? appointment.startsAt;
    appointment.endsAt = input.endsAt ?? appointment.endsAt;
    appointment.notes = input.notes ?? appointment.notes;

    await repository.save(appointment);

    const savedAppointment = await repository.findOneOrFail({
      where: {
        id,
        clinicId,
      },
      relations: {
        patient: true,
        professional: true,
        service: true,
      },
    });

    return this.mapAppointment(savedAppointment);
  }

  public async hasConflict(
    clinicId: string,
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
    manager: EntityManager,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.getRepository(manager)
      .createQueryBuilder("appointment")
      .where("appointment.clinicId = :clinicId", { clinicId })
      .andWhere("appointment.professionalId = :professionalId", { professionalId })
      .andWhere("appointment.status != :cancelledStatus", { cancelledStatus: "cancelled" })
      .andWhere("appointment.startsAt < :endsAt", { endsAt })
      .andWhere("appointment.endsAt > :startsAt", { startsAt });

    if (excludeId) {
      query.andWhere("appointment.id != :excludeId", { excludeId });
    }

    const conflictCount = await query.getCount();
    return conflictCount > 0;
  }

  public async buildNoShowOverview(
    clinicId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<NoShowOverview> {
    const appointments = await this.getRepository().find({
      where: {
        clinicId,
      },
    });

    const periodItems = appointments.filter((appointment) => {
      const startsAtTime = appointment.startsAt.getTime();
      return startsAtTime >= periodStart.getTime() && startsAtTime < periodEnd.getTime();
    });

    const attendedAppointments = periodItems.filter((appointment) => appointment.status === "attended").length;
    const missedAppointments = periodItems.filter((appointment) => appointment.status === "missed").length;
    const totalAppointments = attendedAppointments + missedAppointments;

    return {
      clinicId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalAppointments,
      attendedAppointments,
      missedAppointments,
      noShowRate: totalAppointments === 0 ? 0 : Number((missedAppointments / totalAppointments).toFixed(4)),
    };
  }
}
