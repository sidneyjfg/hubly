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
      clinicId: user.clinicId,
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
      clinicId: user.clinicId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as AuthenticatedUser["role"],
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  public async findProfileByIdInClinic(clinicId: string, id: string): Promise<User | null> {
    const user = await this.getRepository().findOne({
      where: {
        id,
        clinicId,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      clinicId: user.clinicId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async findByClinicAndEmail(clinicId: string, email: string, excludeUserId?: string): Promise<User | null> {
    const user = await this.getRepository().findOne({
      where: {
        clinicId,
        email,
        ...(excludeUserId ? { id: Not(excludeUserId) } : {}),
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      clinicId: user.clinicId,
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
      clinicId: string;
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
      clinicId: input.clinicId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash: input.passwordHash,
      isActive: input.isActive,
    });

    return {
      id: user.id,
      clinicId: user.clinicId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async updateAccountInClinic(
    clinicId: string,
    userId: string,
    input: UserAccountWriteInput,
    manager?: EntityManager,
  ): Promise<User | null> {
    const repository = this.getRepository(manager);
    const user = await repository.findOne({
      where: {
        id: userId,
        clinicId,
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
      clinicId: savedUser.clinicId,
      fullName: savedUser.fullName,
      email: savedUser.email,
      phone: savedUser.phone,
      role: savedUser.role as Role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt.toISOString(),
    };
  }

  public async updatePasswordInClinic(
    clinicId: string,
    userId: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.getRepository(manager);
    const user = await repository.findOne({
      where: {
        id: userId,
        clinicId,
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
