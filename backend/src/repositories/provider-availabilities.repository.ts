import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ProviderAvailabilityEntity } from "../database/entities";
import type { ProviderAvailability, ProviderAvailabilityWriteInput } from "../types/provider";

export class ProviderAvailabilitiesRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ProviderAvailabilityEntity);
  }

  private mapAvailability(availability: ProviderAvailabilityEntity): ProviderAvailability {
    return {
      id: availability.id,
      organizationId: availability.organizationId,
      providerId: availability.providerId,
      weekday: availability.weekday,
      workStart: availability.workStart,
      workEnd: availability.workEnd,
      lunchStart: availability.lunchStart,
      lunchEnd: availability.lunchEnd,
      isActive: availability.isActive,
    };
  }

  public async findByProviderInOrganization(
    organizationId: string,
    providerId: string,
    manager?: EntityManager,
  ): Promise<ProviderAvailability[]> {
    const items = await this.getRepository(manager).find({
      where: {
        organizationId,
        providerId,
      },
      order: {
        weekday: "ASC",
      },
    });

    return items.map((item) => this.mapAvailability(item));
  }

  public async findByProviderAndWeekdayInOrganization(
    organizationId: string,
    providerId: string,
    weekday: number,
    manager?: EntityManager,
  ): Promise<ProviderAvailability | null> {
    const item = await this.getRepository(manager).findOne({
      where: {
        organizationId,
        providerId,
        weekday,
      },
    });

    return item ? this.mapAvailability(item) : null;
  }

  public async replaceForProviderInOrganization(
    organizationId: string,
    providerId: string,
    inputs: ProviderAvailabilityWriteInput[],
    manager?: EntityManager,
  ): Promise<ProviderAvailability[]> {
    const repository = this.getRepository(manager);

    await repository.delete({
      organizationId,
      providerId,
    });

    const entities = inputs.map((input) =>
      repository.create({
        id: randomUUID(),
        organizationId,
        providerId,
        weekday: input.weekday,
        workStart: input.workStart,
        workEnd: input.workEnd,
        lunchStart: input.lunchStart ?? null,
        lunchEnd: input.lunchEnd ?? null,
        isActive: input.isActive ?? true,
      }),
    );

    const saved = await repository.save(entities);
    return saved.map((item) => this.mapAvailability(item));
  }
}
