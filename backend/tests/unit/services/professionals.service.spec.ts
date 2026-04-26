import { describe, expect, it } from "vitest";

import { ProvidersService } from "../../../src/services/providers.service";
import type { ProviderWriteInput } from "../../../src/types/provider";
import { AppError } from "../../../src/utils/app-error";

const authUser = {
  id: "usr_admin_001",
  organizationId: "cln_main_001",
  role: "administrator" as const,
  sessionId: "sess_001",
};

describe("ProvidersService", () => {
  it("creates a provider in the authenticated organization", async () => {
    const service = new ProvidersService(
      {
        async create(organizationId: string, input: ProviderWriteInput) {
          return {
            id: "pro_100",
            organizationId,
            fullName: input.fullName,
            specialty: input.specialty,
            isActive: input.isActive ?? true,
          };
        },
      } as never,
      {} as never,
    );

    const result = await service.create(authUser, {
      fullName: "Dra. Julia Ribeiro",
      specialty: "Dermatologia",
    });

    expect(result.organizationId).toBe("cln_main_001");
    expect(result.isActive).toBe(true);
  });

  it("updates an existing provider", async () => {
    const service = new ProvidersService(
      {
        async updateInOrganization(organizationId: string, id: string, input: ProviderWriteInput) {
          return {
            id,
            organizationId,
            fullName: input.fullName,
            specialty: input.specialty,
            isActive: input.isActive ?? true,
          };
        },
      } as never,
      {} as never,
    );

    const result = await service.update(authUser, "pro_001", {
      fullName: "Dra. Julia Ribeiro",
      specialty: "Dermatologia Organizationa",
      isActive: true,
    });

    expect(result.specialty).toBe("Dermatologia Organizationa");
  });

  it("throws when trying to update a missing provider", async () => {
    const service = new ProvidersService(
      {
        async updateInOrganization() {
          return null;
        },
      } as never,
      {} as never,
    );

    await expect(
      service.update(authUser, "pro_missing", {
        fullName: "Dra. Julia Ribeiro",
        specialty: "Dermatologia",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("changes provider active status", async () => {
    const service = new ProvidersService(
      {
        async setActiveInOrganization(organizationId: string, id: string, isActive: boolean) {
          return {
            id,
            organizationId,
            fullName: "Dra. Julia Ribeiro",
            specialty: "Dermatologia",
            isActive,
          };
        },
      } as never,
      {} as never,
    );

    const result = await service.setStatus(authUser, "pro_001", false);

    expect(result.isActive).toBe(false);
  });
});
