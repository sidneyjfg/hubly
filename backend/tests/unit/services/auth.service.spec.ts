import { describe, expect, it } from "vitest";

import { AuthService } from "../../../src/services/auth.service";
import { AppError } from "../../../src/utils/app-error";
import { hashPassword } from "../../../src/utils/password";

type MockAuthRepository = {
  findByEmail(email: string): Promise<{
    id: string;
    organizationId: string;
    fullName: string;
    email: string;
    phone: string;
    role: "administrator" | "reception" | "provider";
    passwordHash: string;
    isActive: boolean;
  } | null>;
};

type MockAuthSessionsRepository = {
  create(): Promise<void>;
  findActiveById(): Promise<null>;
  revoke(): Promise<void>;
};

const authSessionsRepository: MockAuthSessionsRepository = {
  async create() {},
  async findActiveById() {
    return null;
  },
  async revoke() {},
};

const mockDataSource = {
  async transaction<T>(_: string, callback: () => Promise<T>) {
    return callback();
  },
};

const organizationsRepository = {
  async create() {
    return {
      id: "cln_new_001",
      legalName: "Nova Organizationa LTDA",
      tradeName: "Nova Organizationa",
      timezone: "America/Sao_Paulo",
    };
  },
  async findByIdInOrganization() {
    return null;
  },
};

const auditRepository = {
  async create() {},
};

describe("AuthService", () => {
  it("returns access and refresh tokens for valid credentials", async () => {
    const repository: MockAuthRepository = {
      async findByEmail(email) {
        return {
          id: "usr_admin_001",
          organizationId: "cln_main_001",
          fullName: "Ana Martins",
          email,
          phone: "+5511911111111",
          role: "administrator",
          passwordHash: hashPassword("password123"),
          isActive: true,
        };
      },
    };

    const service = new AuthService(
      mockDataSource as never,
      repository as never,
      authSessionsRepository as never,
      organizationsRepository as never,
      auditRepository as never,
    );

    const result = await service.signIn({
      email: "admin@organization.test",
      password: "password123",
    });

    expect(result.accessToken.split(".")).toHaveLength(3);
    expect(result.refreshToken.split(".")).toHaveLength(3);
    expect(result.role).toBe("administrator");
  });

  it("rejects invalid email input", async () => {
    const repository: MockAuthRepository = {
      async findByEmail() {
        return null;
      },
    };
    const service = new AuthService(
      mockDataSource as never,
      repository as never,
      authSessionsRepository as never,
      organizationsRepository as never,
      auditRepository as never,
    );

    await expect(
      service.signIn({
        email: "invalid-email",
        password: "password123",
      }),
    ).rejects.toThrow();
  });

  it("rejects credentials when repository validation fails", async () => {
    const repository: MockAuthRepository = {
      async findByEmail(email) {
        return {
          id: "usr_admin_001",
          organizationId: "cln_main_001",
          fullName: "Ana Martins",
          email,
          phone: "+5511911111111",
          role: "administrator",
          passwordHash: hashPassword("wrong-password"),
          isActive: true,
        };
      },
    };

    const service = new AuthService(
      mockDataSource as never,
      repository as never,
      authSessionsRepository as never,
      organizationsRepository as never,
      auditRepository as never,
    );

    await expect(
      service.signIn({
        email: "admin@organization.test",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
