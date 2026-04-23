import { describe, expect, it } from "vitest";

import { ProfessionalsService } from "../../../src/services/professionals.service";
import type { ProfessionalWriteInput } from "../../../src/types/professional";
import { AppError } from "../../../src/utils/app-error";

const authUser = {
  id: "usr_admin_001",
  clinicId: "cln_main_001",
  role: "administrator" as const,
  sessionId: "sess_001",
};

describe("ProfessionalsService", () => {
  it("creates a professional in the authenticated clinic", async () => {
    const service = new ProfessionalsService({
      async create(clinicId: string, input: ProfessionalWriteInput) {
        return {
          id: "pro_100",
          clinicId,
          fullName: input.fullName,
          specialty: input.specialty,
          isActive: input.isActive ?? true,
        };
      },
    } as never);

    const result = await service.create(authUser, {
      fullName: "Dra. Julia Ribeiro",
      specialty: "Dermatologia",
    });

    expect(result.clinicId).toBe("cln_main_001");
    expect(result.isActive).toBe(true);
  });

  it("updates an existing professional", async () => {
    const service = new ProfessionalsService({
      async updateInClinic(clinicId: string, id: string, input: ProfessionalWriteInput) {
        return {
          id,
          clinicId,
          fullName: input.fullName,
          specialty: input.specialty,
          isActive: input.isActive ?? true,
        };
      },
    } as never);

    const result = await service.update(authUser, "pro_001", {
      fullName: "Dra. Julia Ribeiro",
      specialty: "Dermatologia Clinica",
      isActive: true,
    });

    expect(result.specialty).toBe("Dermatologia Clinica");
  });

  it("throws when trying to update a missing professional", async () => {
    const service = new ProfessionalsService({
      async updateInClinic() {
        return null;
      },
    } as never);

    await expect(
      service.update(authUser, "pro_missing", {
        fullName: "Dra. Julia Ribeiro",
        specialty: "Dermatologia",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("changes professional active status", async () => {
    const service = new ProfessionalsService({
      async setActiveInClinic(clinicId: string, id: string, isActive: boolean) {
        return {
          id,
          clinicId,
          fullName: "Dra. Julia Ribeiro",
          specialty: "Dermatologia",
          isActive,
        };
      },
    } as never);

    const result = await service.setStatus(authUser, "pro_001", false);

    expect(result.isActive).toBe(false);
  });
});
