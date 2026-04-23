import type { DataSource, EntityManager } from "typeorm";

import { AuthSessionEntity } from "../database/entities";

type CreateSessionInput = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
};

export class AuthSessionsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(AuthSessionEntity);
  }

  public async create(input: CreateSessionInput, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).save({
      id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    });
  }

  public async findActiveById(sessionId: string): Promise<AuthSessionEntity | null> {
    return this.getRepository().findOne({
      where: {
        id: sessionId,
      },
      relations: {
        user: true,
      },
    });
  }

  public async revoke(sessionId: string): Promise<void> {
    await this.getRepository().update(
      { id: sessionId },
      { revokedAt: new Date() },
    );
  }
}
