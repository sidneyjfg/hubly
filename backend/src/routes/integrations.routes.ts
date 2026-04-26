import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { IntegrationsController } from "../controllers/integrations.controller";
import {
  integrationsListRouteSchema,
  whatsappRegenerateCodeRouteSchema,
  whatsappDisconnectRouteSchema,
  whatsappSessionStartRouteSchema,
  whatsappConnectRouteSchema,
  whatsappSendTextRouteSchema,
  whatsappStatusRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { EvolutionWhatsAppService } from "../services/evolution-whatsapp.service";
import { IntegrationsService } from "../services/integrations.service";

type IntegrationsRouteOptions = {
  dataSource: DataSource;
};

export const integrationsRoutes = async (
  app: FastifyInstance,
  options: IntegrationsRouteOptions,
): Promise<void> => {
  const integrationsController = new IntegrationsController(
    new IntegrationsService(
      options.dataSource,
      new OrganizationIntegrationsRepository(options.dataSource),
      new AuditRepository(options.dataSource),
      new EvolutionWhatsAppService(),
    ),
  );

  app.get(
    "/integrations",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: integrationsListRouteSchema,
    },
    integrationsController.list,
  );

  app.get(
    "/integrations/whatsapp/status",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: whatsappStatusRouteSchema,
    },
    integrationsController.whatsappStatus,
  );

  app.get(
    "/integrations/whatsapp/connect",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: whatsappConnectRouteSchema,
    },
    integrationsController.whatsappConnect,
  );

  app.post(
    "/integrations/whatsapp/session",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: whatsappSessionStartRouteSchema,
    },
    integrationsController.startWhatsAppSession,
  );

  app.post(
    "/integrations/whatsapp/session/regenerate-code",
    {
      preHandler: allowRoles(["administrator", "reception"]),
      schema: whatsappRegenerateCodeRouteSchema,
    },
    integrationsController.regenerateWhatsAppCode,
  );

  app.post(
    "/integrations/whatsapp/disconnect",
    {
      preHandler: [
        allowRoles(["administrator", "reception"]),
        criticalRouteRateLimitMiddleware("integrations:whatsapp:disconnect"),
      ],
      schema: whatsappDisconnectRouteSchema,
    },
    integrationsController.disconnectWhatsApp,
  );

  app.post(
    "/integrations/whatsapp/messages/send",
    {
      preHandler: [
        allowRoles(["administrator", "reception"]),
        criticalRouteRateLimitMiddleware("integrations:whatsapp:send"),
      ],
      schema: whatsappSendTextRouteSchema,
    },
    integrationsController.sendWhatsAppText,
  );
};
