import { randomUUID } from "node:crypto";
import { Not } from "typeorm";
import type { DataSource, EntityManager } from "typeorm";

import { UserEntity } from "../database/entities";
import type { AuthenticatedUser } from "../types/auth";
import type { User, UserAccountWriteInput } from "../types/user";
import type { Role } from "../utils/roles";

export class AuthRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(UserEntity);
  }

  public async findByEmail(email: string): Promise<AuthenticatedUser | null> {
    const user = await this.getRepository().findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as AuthenticatedUser["role"],
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  public async findById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.getRepository().findOne({
      where: {
        id,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as AuthenticatedUser["role"],
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  public async findProfileByIdInOrganization(organizationId: string, id: string): Promise<User | null> {
    const user = await this.getRepository().findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async findByOrganizationAndEmail(organizationId: string, email: string, excludeUserId?: string): Promise<User | null> {
    const user = await this.getRepository().findOne({
      where: {
        organizationId,
        email,
        ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async create(
    input: {
      organizationId: string;
      fullName: string;
      email: string;
      phone: string;
      role: Role;
      passwordHash: string;
      isActive: boolean;
    },
    manager?: EntityManager,
  ): Promise<User> {
    const user = await this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash: input.passwordHash,
      isActive: input.isActive,
    });

    return {
      id: user.id,
      organizationId: user.organizationId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async updateAccountInOrganization(
    organizationId: string,
    userId: string,
    input: UserAccountWriteInput,
    manager?: EntityManager,
  ): Promise<User | null> {
    const repository = this.getRepository(manager);
    const user = await repository.findOne({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      return null;
    }

    user.fullName = input.fullName;
    user.email = input.email;
    user.phone = input.phone;

    const savedUser = await repository.save(user);

    return {
      id: savedUser.id,
      organizationId: savedUser.organizationId,
      fullName: savedUser.fullName,
      email: savedUser.email,
      phone: savedUser.phone,
      role: savedUser.role as Role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt.toISOString(),
    };
  }

  public async updatePasswordInOrganization(
    organizationId: string,
    userId: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.getRepository(manager);
    const user = await repository.findOne({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      return false;
    }

    user.passwordHash = passwordHash;
    await repository.save(user);
    return true;
  }
}
