import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { AuditEventEntity } from "../database/entities";
import type { AuditEvent } from "../types/audit";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

type AuditCreateInput = {
  organizationId: string;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  occurredAt?: Date;
};

export class AuditRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(AuditEventEntity);
  }

  public async findAll(organizationId: string, pagination: Pagination): Promise<PaginatedResult<AuditEvent>> {
    const [items, total] = await this.getRepository().findAndCount({
      where: {
        organizationId,
      },
      order: {
        occurredAt: "DESC",
      },
      skip: getPaginationOffset(pagination),
      take: pagination.limit,
    });

    return buildPaginatedResult(items.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      actorId: item.actorId ?? "",
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      occurredAt: item.occurredAt.toISOString(),
    })), total, pagination);
  }

  public async create(input: AuditCreateInput, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      occurredAt: input.occurredAt ?? new Date(),
    });
  }
}
