import { describe, expect, it } from "vitest";

import { ClinicsService } from "../../../src/services/clinics.service";

describe("ClinicsService", () => {
  it("lists clinics from repository", async () => {
    const service = new ClinicsService({
      async findAll() {
        return {
          items: [
            {
              id: "cln_main_001",
              legalName: "Clinica Exemplo LTDA",
              tradeName: "Clinica Exemplo",
              timezone: "America/Sao_Paulo",
            },
          ],
          limit: 20,
          page: 1,
          total: 1,
          totalPages: 1,
        };
      },
    } as never);

    const result = await service.list({
      id: "usr_admin_001",
      clinicId: "cln_main_001",
      role: "administrator",
      sessionId: "sess_001",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.tradeName).toBe("Clinica Exemplo");
  });
});
