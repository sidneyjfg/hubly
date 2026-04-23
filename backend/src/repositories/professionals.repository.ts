import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ProfessionalEntity } from "../database/entities";
import type { Professional, ProfessionalWriteInput } from "../types/professional";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class ProfessionalsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ProfessionalEntity);
  }

  private mapProfessional(professional: ProfessionalEntity): Professional {
    return {
      id: professional.id,
      clinicId: professional.clinicId,
      fullName: professional.fullName,
      specialty: professional.specialty,
      isActive: professional.isActive,
    };
  }

  public async findAll(clinicId: string, pagination: Pagination): Promise<PaginatedResult<Professional>> {
    const [professionals, total] = await this.getRepository().findAndCount({
      where: {
        clinicId,
      },
      order: {
        fullName: "ASC",
      },
      skip: getPaginationOffset(pagination),
      take: pagination.limit,
    });

    return buildPaginatedResult(professionals.map((professional) => this.mapProfessional(professional)), total, pagination);
  }

  public async findByIdInClinic(
    clinicId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<Professional | null> {
    const professional = await this.getRepository(manager).findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!professional) {
      return null;
    }

    return this.mapProfessional(professional);
  }

  public async create(clinicId: string, input: ProfessionalWriteInput): Promise<Professional> {
    const professional = await this.getRepository().save({
      id: randomUUID(),
      clinicId,
      fullName: input.fullName,
      specialty: input.specialty,
      isActive: input.isActive ?? true,
    });

    return this.mapProfessional(professional);
  }

  public async updateInClinic(
    clinicId: string,
    id: string,
    input: ProfessionalWriteInput,
  ): Promise<Professional | null> {
    const repository = this.getRepository();
    const professional = await repository.findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!professional) {
      return null;
    }

    professional.fullName = input.fullName;
    professional.specialty = input.specialty;
    professional.isActive = input.isActive ?? professional.isActive;

    const savedProfessional = await repository.save(professional);

    return this.mapProfessional(savedProfessional);
  }

  public async setActiveInClinic(clinicId: string, id: string, isActive: boolean): Promise<Professional | null> {
    const repository = this.getRepository();
    const professional = await repository.findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!professional) {
      return null;
    }

    professional.isActive = isActive;
    const savedProfessional = await repository.save(professional);

    return this.mapProfessional(savedProfessional);
  }
}
