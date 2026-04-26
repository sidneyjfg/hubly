import type { DataSource } from "typeorm";

import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type {
  IntegrationSummary,
  WhatsAppConnectCode,
  WhatsAppConnectionStatus,
  WhatsAppDisconnectResult,
  WhatsAppSessionConnectResult,
  WhatsAppSessionStartInput,
  WhatsAppTextMessageInput,
  WhatsAppTextMessageResult,
} from "../types/integration";
import { AppError } from "../utils/app-error";
import { EvolutionWhatsAppService } from "./evolution-whatsapp.service";
import { z } from "zod";

const whatsappSessionSchema = z.object({
  phoneNumber: z.string().min(10).max(30),
});

const connectedWhatsAppStates = new Set(["open", "connected"]);

function isWhatsAppConnected(state: string | null | undefined): boolean {
  return connectedWhatsAppStates.has((state ?? "").toLowerCase());
}

export class IntegrationsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationIntegrationsRepository: OrganizationIntegrationsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly evolutionWhatsAppService: EvolutionWhatsAppService,
  ) {}

  public async list(user: AuthenticatedRequestUser): Promise<{ items: IntegrationSummary[] }> {
    const integration = await this.organizationIntegrationsRepository.findByOrganizationAndChannel(user.organizationId, "whatsapp");
    return this.evolutionWhatsAppService.list(integration?.status ?? null, integration?.phoneNumber ?? null);
  }

  public async getWhatsAppStatus(user: AuthenticatedRequestUser): Promise<WhatsAppConnectionStatus> {
    const integration = await this.ensureWhatsAppIntegration(user);
    const status = await this.evolutionWhatsAppService.getStatus(integration.instanceName);
    await this.organizationIntegrationsRepository.updateStatus(integration.id, status.state);
    return {
      ...status,
      phoneNumber: integration.phoneNumber,
    };
  }

  public async connectWhatsApp(user: AuthenticatedRequestUser, number?: string): Promise<WhatsAppConnectCode> {
    const integration = await this.ensureWhatsAppIntegration(user);
    return this.evolutionWhatsAppService.connect(integration.instanceName, number);
  }

  public async disconnectWhatsApp(user: AuthenticatedRequestUser): Promise<WhatsAppDisconnectResult> {
    const integration = await this.organizationIntegrationsRepository.findByOrganizationAndChannel(user.organizationId, "whatsapp");

    if (!integration) {
      return {
        state: "disconnected",
      };
    }

    const result = await this.evolutionWhatsAppService.logoutInstance(integration.instanceName);
    await this.organizationIntegrationsRepository.updateStatus(integration.id, result.state);
    await this.auditRepository.create({
      organizationId: user.organizationId,
      actorId: user.id,
      action: "integration.whatsapp.disconnected",
      targetType: "integration",
      targetId: integration.id,
    });

    return result;
  }

  public async startWhatsAppSession(
    user: AuthenticatedRequestUser,
    input: WhatsAppSessionStartInput,
  ): Promise<WhatsAppSessionConnectResult> {
    const data = whatsappSessionSchema.parse(input);
    const integration = await this.ensureWhatsAppIntegration(user);
    const currentStatus = await this.evolutionWhatsAppService.getStatus(integration.instanceName);

    await this.organizationIntegrationsRepository.updateStatus(integration.id, currentStatus.state);

    if (isWhatsAppConnected(currentStatus.state)) {
      throw new AppError(
        "whatsapp.already_connected",
        "WhatsApp já está conectado. Desconecte antes de gerar um novo código.",
        409,
      );
    }

    const connectResult = await this.evolutionWhatsAppService.connect(integration.instanceName, data.phoneNumber);
    const status = await this.evolutionWhatsAppService.getStatus(integration.instanceName);

    await this.organizationIntegrationsRepository.updateStatus(integration.id, status.state);
    await this.organizationIntegrationsRepository.updatePhoneNumber(integration.id, data.phoneNumber);
    await this.auditRepository.create({
      organizationId: user.organizationId,
      actorId: user.id,
      action: "integration.whatsapp.code_requested",
      targetType: "integration",
      targetId: integration.id,
    });

    return {
      state: status.state,
      phoneNumber: data.phoneNumber,
      ...(connectResult.pairingCode === undefined ? {} : { pairingCode: connectResult.pairingCode }),
      ...(connectResult.code === undefined ? {} : { code: connectResult.code }),
      ...(connectResult.count === undefined ? {} : { count: connectResult.count }),
    };
  }

  public async regenerateWhatsAppCode(
    user: AuthenticatedRequestUser,
    input: WhatsAppSessionStartInput,
  ): Promise<WhatsAppSessionConnectResult> {
    const data = whatsappSessionSchema.parse(input);
    const integration = await this.ensureWhatsAppIntegration(user);
    const currentStatus = await this.evolutionWhatsAppService.getStatus(integration.instanceName);

    await this.organizationIntegrationsRepository.updateStatus(integration.id, currentStatus.state);

    if (isWhatsAppConnected(currentStatus.state)) {
      throw new AppError(
        "whatsapp.already_connected",
        "WhatsApp já está conectado. Desconecte antes de gerar um novo código.",
        409,
      );
    }

    await this.evolutionWhatsAppService.restartInstance(integration.instanceName);

    const connectResult = await this.evolutionWhatsAppService.connect(integration.instanceName, data.phoneNumber);
    const status = await this.evolutionWhatsAppService.getStatus(integration.instanceName);

    await this.organizationIntegrationsRepository.updateStatus(integration.id, status.state);
    await this.organizationIntegrationsRepository.updatePhoneNumber(integration.id, data.phoneNumber);
    await this.auditRepository.create({
      organizationId: user.organizationId,
      actorId: user.id,
      action: "integration.whatsapp.code_regenerated",
      targetType: "integration",
      targetId: integration.id,
    });

    return {
      state: status.state,
      phoneNumber: data.phoneNumber,
      ...(connectResult.pairingCode === undefined ? {} : { pairingCode: connectResult.pairingCode }),
      ...(connectResult.code === undefined ? {} : { code: connectResult.code }),
      ...(connectResult.count === undefined ? {} : { count: connectResult.count }),
    };
  }

  public async sendWhatsAppText(
    user: AuthenticatedRequestUser,
    input: WhatsAppTextMessageInput,
  ): Promise<WhatsAppTextMessageResult> {
    const integration = await this.ensureWhatsAppIntegration(user);
    return this.evolutionWhatsAppService.sendText(integration.instanceName, input);
  }

  private async ensureWhatsAppIntegration(user: AuthenticatedRequestUser) {
    const existingIntegration = await this.organizationIntegrationsRepository.findByOrganizationAndChannel(user.organizationId, "whatsapp");
    if (existingIntegration) {
      return existingIntegration;
    }

    const instanceName = this.buildInstanceName(user.organizationId);

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const currentIntegration = await this.organizationIntegrationsRepository.findByOrganizationAndChannel(
        user.organizationId,
        "whatsapp",
        manager,
      );

      if (currentIntegration) {
        return currentIntegration;
      }

      const createdInstance = await this.evolutionWhatsAppService.createInstance(instanceName);
      const integration = await this.organizationIntegrationsRepository.create(
        {
          organizationId: user.organizationId,
          channel: "whatsapp",
          provider: "evolution",
          instanceName: createdInstance.instance?.instanceName ?? instanceName,
          status: createdInstance.instance?.status ?? "created",
        },
        manager,
      );

      await this.auditRepository.create(
        {
          organizationId: user.organizationId,
          actorId: user.id,
          action: "integration.whatsapp.instance_created",
          targetType: "integration",
          targetId: integration.id,
        },
        manager,
      );

      return integration;
    });
  }

  private buildInstanceName(organizationId: string): string {
    return `organization-${organizationId}`;
  }
}
