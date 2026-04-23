import type { DataSource, EntityManager } from "typeorm";
import { randomUUID } from "node:crypto";

import { ClinicEntity } from "../database/entities";
import type { Clinic, ClinicWriteInput } from "../types/clinic";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class ClinicsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ClinicEntity);
  }

  private mapClinic(clinic: ClinicEntity): Clinic {
    return {
      id: clinic.id,
      legalName: clinic.legalName,
      tradeName: clinic.tradeName,
      timezone: clinic.timezone,
    };
  }

  public async findAll(pagination: Pagination, clinicId?: string): Promise<PaginatedResult<Clinic>> {
    const [clinics, total] = clinicId
      ? await this.getRepository().findAndCount({
          where: { id: clinicId },
          order: {
            tradeName: "ASC",
          },
          skip: getPaginationOffset(pagination),
          take: pagination.limit,
        })
      : await this.getRepository().findAndCount({
          order: {
            tradeName: "ASC",
          },
          skip: getPaginationOffset(pagination),
          take: pagination.limit,
        });

    return buildPaginatedResult(clinics.map((clinic) => this.mapClinic(clinic)), total, pagination);
  }

  public async findByIdInClinic(clinicId: string, id: string, manager?: EntityManager): Promise<Clinic | null> {
    const clinic = await this.getRepository(manager).findOne({
      where: {
        id,
      },
    });

    if (!clinic || clinic.id !== clinicId) {
      return null;
    }

    return this.mapClinic(clinic);
  }

  public async create(input: ClinicWriteInput, manager?: EntityManager): Promise<Clinic> {
    const clinic = await this.getRepository(manager).save({
      id: randomUUID(),
      legalName: input.legalName,
      tradeName: input.tradeName,
      timezone: input.timezone,
    });

    return this.mapClinic(clinic);
  }

  public async updateInClinic(clinicId: string, id: string, input: ClinicWriteInput): Promise<Clinic | null> {
    const repository = this.getRepository();
    const clinic = await repository.findOne({
      where: {
        id,
      },
    });

    if (!clinic || clinic.id !== clinicId) {
      return null;
    }

    clinic.legalName = input.legalName;
    clinic.tradeName = input.tradeName;
    clinic.timezone = input.timezone;

    const savedClinic = await repository.save(clinic);

    return this.mapClinic(savedClinic);
  }
}
