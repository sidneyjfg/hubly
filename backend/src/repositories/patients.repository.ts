import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { PatientEntity } from "../database/entities";
import type { Patient, PatientWriteInput } from "../types/patient";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class PatientsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(PatientEntity);
  }

  private mapPatient(patient: PatientEntity): Patient {
    return {
      id: patient.id,
      clinicId: patient.clinicId,
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      isActive: patient.isActive,
    };
  }

  public async findAll(clinicId: string, pagination: Pagination): Promise<PaginatedResult<Patient>> {
    const [patients, total] = await this.getRepository().findAndCount({
      where: {
        clinicId,
      },
      order: {
        fullName: "ASC",
      },
      skip: getPaginationOffset(pagination),
      take: pagination.limit,
    });

    return buildPaginatedResult(patients.map((patient) => this.mapPatient(patient)), total, pagination);
  }

  public async findByIdInClinic(clinicId: string, id: string, manager?: EntityManager): Promise<Patient | null> {
    const patient = await this.getRepository(manager).findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!patient) {
      return null;
    }

    return this.mapPatient(patient);
  }

  public async create(clinicId: string, input: PatientWriteInput): Promise<Patient> {
    const patient = await this.getRepository().save({
      id: randomUUID(),
      clinicId,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone,
    });

    return this.mapPatient(patient);
  }

  public async updateInClinic(clinicId: string, id: string, input: PatientWriteInput): Promise<Patient | null> {
    const repository = this.getRepository();
    const patient = await repository.findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!patient) {
      return null;
    }

    patient.fullName = input.fullName;
    patient.email = input.email ?? null;
    patient.phone = input.phone;

    const savedPatient = await repository.save(patient);

    return this.mapPatient(savedPatient);
  }

  public async setActiveInClinic(clinicId: string, id: string, isActive: boolean): Promise<Patient | null> {
    const repository = this.getRepository();
    const patient = await repository.findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!patient) {
      return null;
    }

    patient.isActive = isActive;
    const savedPatient = await repository.save(patient);

    return this.mapPatient(savedPatient);
  }
}
