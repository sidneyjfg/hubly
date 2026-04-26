import { describe, expect, it } from "vitest";

import { OrganizationsService } from "../../../src/services/organizations.service";

describe("OrganizationsService", () => {
  it("lists organizations from repository", async () => {
    const service = new OrganizationsService({
      async findAll() {
        return {
          items: [
            {
              id: "cln_main_001",
              legalName: "Organizationa Exemplo LTDA",
              tradeName: "Organizationa Exemplo",
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
      organizationId: "cln_main_001",
      role: "administrator",
      sessionId: "sess_001",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.tradeName).toBe("Organizationa Exemplo");
  });
});
