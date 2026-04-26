import { DataSource } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initializeAppDataSource } from "../../../src/database/data-source";
import { seedDatabase } from "../../../src/database/seeds/seed-database";
import { AuditRepository } from "../../../src/repositories/audit.repository";
import { OrganizationIntegrationsRepository } from "../../../src/repositories/organization-integrations.repository";
import { EvolutionWhatsAppService } from "../../../src/services/evolution-whatsapp.service";
import { IntegrationsService } from "../../../src/services/integrations.service";

describe("IntegrationsService", () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await initializeAppDataSource({
      type: "sqljs",
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await seedDatabase(dataSource);
  });

  it("creates the organization WhatsApp instance automatically and audits it", async () => {
    const evolutionWhatsAppService = {
      createInstance: vi.fn().mockResolvedValue({
        instance: {
          instanceName: "organization-cln_main_001",
          status: "created",
        },
      }),
      getStatus: vi.fn().mockResolvedValue({
        state: "connecting",
      }),
      connect: vi.fn(),
      sendText: vi.fn(),
      list: vi.fn(),
    };

    const service = new IntegrationsService(
      dataSource,
      new OrganizationIntegrationsRepository(dataSource),
      new AuditRepository(dataSource),
      evolutionWhatsAppService as unknown as EvolutionWhatsAppService,
    );

    const result = await service.getWhatsAppStatus({
      id: "usr_admin_001",
      organizationId: "cln_main_001",
      role: "administrator",
      sessionId: "session-1",
    });

    expect(result.state).toBe("connecting");
    expect(evolutionWhatsAppService.createInstance).toHaveBeenCalledWith("organization-cln_main_001");
    expect(evolutionWhatsAppService.getStatus).toHaveBeenCalledWith("organization-cln_main_001");

    const integration = await new OrganizationIntegrationsRepository(dataSource).findByOrganizationAndChannel(
      "cln_main_001",
      "whatsapp",
    );
    expect(integration?.instanceName).toBe("organization-cln_main_001");
    expect(integration?.status).toBe("connecting");

    const auditEvents = await new AuditRepository(dataSource).findAll("cln_main_001", { page: 1, limit: 20 });
    expect(auditEvents.items.some((item) => item.action === "integration.whatsapp.instance_created")).toBe(true);

    await dataSource.destroy();
  });
});
