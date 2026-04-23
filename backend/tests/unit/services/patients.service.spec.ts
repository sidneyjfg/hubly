import { describe, expect, it } from "vitest";

import { PatientsService } from "../../../src/services/patients.service";
import type { PatientWriteInput } from "../../../src/types/patient";
import { AppError } from "../../../src/utils/app-error";

const authUser = {
  id: "usr_admin_001",
  clinicId: "cln_main_001",
  role: "administrator" as const,
  sessionId: "sess_001",
};

describe("PatientsService", () => {
  it("creates a patient in the authenticated clinic", async () => {
    const service = new PatientsService({
      async create(clinicId: string, input: PatientWriteInput) {
        return {
          id: "pat_100",
          clinicId,
          fullName: input.fullName,
          email: input.email ?? null,
          phone: input.phone,
        };
      },
    } as never);

    const result = await service.create(authUser, {
      fullName: "Marcos Paulo",
      email: "marcos@patient.test",
      phone: "+5511955555555",
    });

    expect(result.clinicId).toBe("cln_main_001");
    expect(result.email).toBe("marcos@patient.test");
  });

  it("updates an existing patient", async () => {
    const service = new PatientsService({
      async updateInClinic(clinicId: string, id: string, input: PatientWriteInput) {
        return {
          id,
          clinicId,
          fullName: input.fullName,
          email: input.email ?? null,
          phone: input.phone,
        };
      },
    } as never);

    const result = await service.update(authUser, "pat_001", {
      fullName: "Marcos Paulo Lima",
      email: "marcos.lima@patient.test",
      phone: "+5511944444444",
    });

    expect(result.fullName).toBe("Marcos Paulo Lima");
  });

  it("throws when trying to update a missing patient", async () => {
    const service = new PatientsService({
      async updateInClinic() {
        return null;
      },
    } as never);

    await expect(
      service.update(authUser, "pat_missing", {
        fullName: "Marcos Paulo",
        email: "marcos@patient.test",
        phone: "+5511955555555",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
