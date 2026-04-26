import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ProviderEntity } from "../database/entities";
import type { Provider, ProviderWriteInput } from "../types/provider";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class ProvidersRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ProviderEntity);
  }

  private mapProvider(provider: ProviderEntity): Provider {
    return {
      id: provider.id,
      organizationId: provider.organizationId,
      fullName: provider.fullName,
      specialty: provider.specialty,
      isActive: provider.isActive,
    };
  }

  public async findAll(organizationId: string, pagination: Pagination): Promise<PaginatedResult<Provider>> {
    const [providers, total] = await this.getRepository().findAndCount({
      where: {
        organizationId,
      },
      order: {
        fullName: "ASC",
      },
      skip: getPaginationOffset(pagination),
      take: pagination.limit,
    });

    return buildPaginatedResult(providers.map((provider) => this.mapProvider(provider)), total, pagination);
  }

  public async findActiveByOrganization(organizationId: string, manager?: EntityManager): Promise<Provider[]> {
    const providers = await this.getRepository(manager).find({
      where: {
        organizationId,
        isActive: true,
      },
      order: {
        fullName: "ASC",
      },
    });

    return providers.map((provider) => this.mapProvider(provider));
  }

  public async findByIdInOrganization(
    organizationId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<Provider | null> {
    const provider = await this.getRepository(manager).findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!provider) {
      return null;
    }

    return this.mapProvider(provider);
  }

  public async create(organizationId: string, input: ProviderWriteInput): Promise<Provider> {
    const provider = await this.getRepository().save({
      id: randomUUID(),
      organizationId,
      fullName: input.fullName,
      specialty: input.specialty,
      isActive: input.isActive ?? true,
    });

    return this.mapProvider(provider);
  }

  public async updateInOrganization(
    organizationId: string,
    id: string,
    input: ProviderWriteInput,
  ): Promise<Provider | null> {
    const repository = this.getRepository();
    const provider = await repository.findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!provider) {
      return null;
    }

    provider.fullName = input.fullName;
    provider.specialty = input.specialty;
    provider.isActive = input.isActive ?? provider.isActive;

    const savedProvider = await repository.save(provider);

    return this.mapProvider(savedProvider);
  }

  public async setActiveInOrganization(organizationId: string, id: string, isActive: boolean): Promise<Provider | null> {
    const repository = this.getRepository();
    const provider = await repository.findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!provider) {
      return null;
    }

    provider.isActive = isActive;
    const savedProvider = await repository.save(provider);

    return this.mapProvider(savedProvider);
  }
}
