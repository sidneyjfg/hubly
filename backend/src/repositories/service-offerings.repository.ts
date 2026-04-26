import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ServiceOfferingEntity } from "../database/entities";
import type { ServiceOffering, ServiceOfferingWriteInput } from "../types/provider";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class ServiceOfferingsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ServiceOfferingEntity);
  }

  private mapService(service: ServiceOfferingEntity): ServiceOffering {
    return {
      id: service.id,
      organizationId: service.organizationId,
      providerId: service.providerId,
      providerName: service.provider?.fullName,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      isActive: service.isActive,
    };
  }

  public async findAll(
    organizationId: string,
    filters: { pagination: Pagination; providerId?: string },
  ): Promise<PaginatedResult<ServiceOffering>> {
    const query = this.getRepository().createQueryBuilder("service")
      .leftJoinAndSelect("service.provider", "provider")
      .where("service.organizationId = :organizationId", { organizationId });

    if (filters.providerId) {
      query.andWhere("service.providerId = :providerId", { providerId: filters.providerId });
    }

    const [services, total] = await query
      .orderBy("provider.fullName", "ASC")
      .addOrderBy("service.name", "ASC")
      .skip(getPaginationOffset(filters.pagination))
      .take(filters.pagination.limit)
      .getManyAndCount();

    return buildPaginatedResult(services.map((service) => this.mapService(service)), total, filters.pagination);
  }

  public async findActiveByOrganization(
    organizationId: string,
    filters: { providerId?: string } = {},
    manager?: EntityManager,
  ): Promise<ServiceOffering[]> {
    const repository = this.getRepository(manager);
    const services = await repository.find({
      where: {
        organizationId,
        isActive: true,
        ...(filters.providerId ? { providerId: filters.providerId } : {}),
      },
      relations: {
        provider: true,
      },
      order: {
        name: "ASC",
      },
    });

    return services.map((service) => this.mapService(service));
  }

  public async findByIdInOrganization(
    organizationId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<ServiceOffering | null> {
    const service = await this.getRepository(manager).findOne({
      where: {
        id,
        organizationId,
      },
      relations: {
        provider: true,
      },
    });

    return service ? this.mapService(service) : null;
  }

  public async create(organizationId: string, input: ServiceOfferingWriteInput): Promise<ServiceOffering> {
    const service = await this.getRepository().save({
      id: randomUUID(),
      organizationId,
      providerId: input.providerId,
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents ?? null,
      isActive: input.isActive ?? true,
    });

    const savedService = await this.getRepository().findOneOrFail({
      where: {
        id: service.id,
        organizationId,
      },
      relations: {
        provider: true,
      },
    });

    return this.mapService(savedService);
  }

  public async updateInOrganization(
    organizationId: string,
    id: string,
    input: ServiceOfferingWriteInput,
  ): Promise<ServiceOffering | null> {
    const repository = this.getRepository();
    const service = await repository.findOne({
      where: {
        id,
        organizationId,
      },
      relations: {
        provider: true,
      },
    });

    if (!service) {
      return null;
    }

    service.providerId = input.providerId;
    service.name = input.name;
    service.durationMinutes = input.durationMinutes;
    service.priceCents = input.priceCents ?? null;
    service.isActive = input.isActive ?? service.isActive;

    await repository.save(service);

    const savedService = await repository.findOneOrFail({
      where: {
        id,
        organizationId,
      },
      relations: {
        provider: true,
      },
    });

    return this.mapService(savedService);
  }

  public async setActiveInOrganization(organizationId: string, id: string, isActive: boolean): Promise<ServiceOffering | null> {
    const repository = this.getRepository();
    const service = await repository.findOne({
      where: {
        id,
        organizationId,
      },
      relations: {
        provider: true,
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
