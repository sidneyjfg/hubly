import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ProfessionalServiceEntity } from "../database/entities";
import type { ProfessionalService, ProfessionalServiceWriteInput } from "../types/professional";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class ProfessionalServicesRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ProfessionalServiceEntity);
  }

  private mapService(service: ProfessionalServiceEntity): ProfessionalService {
    return {
      id: service.id,
      clinicId: service.clinicId,
      professionalId: service.professionalId,
      professionalName: service.professional?.fullName,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      isActive: service.isActive,
    };
  }

  public async findAll(
    clinicId: string,
    filters: { pagination: Pagination; professionalId?: string },
  ): Promise<PaginatedResult<ProfessionalService>> {
    const query = this.getRepository().createQueryBuilder("service")
      .leftJoinAndSelect("service.professional", "professional")
      .where("service.clinicId = :clinicId", { clinicId });

    if (filters.professionalId) {
      query.andWhere("service.professionalId = :professionalId", { professionalId: filters.professionalId });
    }

    const [services, total] = await query
      .orderBy("professional.fullName", "ASC")
      .addOrderBy("service.name", "ASC")
      .skip(getPaginationOffset(filters.pagination))
      .take(filters.pagination.limit)
      .getManyAndCount();

    return buildPaginatedResult(services.map((service) => this.mapService(service)), total, filters.pagination);
  }

  public async findByIdInClinic(
    clinicId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<ProfessionalService | null> {
    const service = await this.getRepository(manager).findOne({
      where: {
        id,
        clinicId,
      },
      relations: {
        professional: true,
      },
    });

    return service ? this.mapService(service) : null;
  }

  public async create(clinicId: string, input: ProfessionalServiceWriteInput): Promise<ProfessionalService> {
    const service = await this.getRepository().save({
      id: randomUUID(),
      clinicId,
      professionalId: input.professionalId,
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents ?? null,
      isActive: input.isActive ?? true,
    });

    const savedService = await this.getRepository().findOneOrFail({
      where: {
        id: service.id,
        clinicId,
      },
      relations: {
        professional: true,
      },
    });

    return this.mapService(savedService);
  }

  public async updateInClinic(
    clinicId: string,
    id: string,
    input: ProfessionalServiceWriteInput,
  ): Promise<ProfessionalService | null> {
    const repository = this.getRepository();
    const service = await repository.findOne({
      where: {
        id,
        clinicId,
      },
      relations: {
        professional: true,
      },
    });

    if (!service) {
      return null;
    }

    service.professionalId = input.professionalId;
    service.name = input.name;
    service.durationMinutes = input.durationMinutes;
    service.priceCents = input.priceCents ?? null;
    service.isActive = input.isActive ?? service.isActive;

    await repository.save(service);

    const savedService = await repository.findOneOrFail({
      where: {
        id,
        clinicId,
      },
      relations: {
        professional: true,
      },
    });

    return this.mapService(savedService);
  }

  public async setActiveInClinic(clinicId: string, id: string, isActive: boolean): Promise<ProfessionalService | null> {
    const repository = this.getRepository();
    const service = await repository.findOne({
      where: {
        id,
        clinicId,
      },
      relations: {
        professional: true,
      },
    });

    if (!service) {
      return null;
    }

    service.isActive = isActive;
    const savedService = await repository.save(service);

    return this.mapService(savedService);
  }
}
