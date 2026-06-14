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

function ensureConnectionChallengeReturned(connectResult: { pairingCode?: string; code?: string; qrCode?: string }): void {
  if (connectResult.pairingCode || connectResult.code || connectResult.qrCode) {
    return;
  }

  throw new AppError(
    "whatsapp.connection_challenge_not_returned",
    "A Evolution API não retornou QR code nem código de pareamento. Verifique se a instância antiga foi removida.",
    502,
  );
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

    const connectResult = await this.createCleanConnectionChallenge(integration, data.phoneNumber);

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
      ...(connectResult.qrCode === undefined ? {} : { qrCode: connectResult.qrCode }),
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

    const connectResult = await this.createCleanConnectionChallenge(integration, data.phoneNumber);

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
      ...(connectResult.qrCode === undefined ? {} : { qrCode: connectResult.qrCode }),
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

      const existingStatus = await this.findExistingWhatsAppInstanceState(instanceName);
      const createdInstance = existingStatus ? null : await this.evolutionWhatsAppService.createInstance(instanceName);
      const resolvedInstanceName = createdInstance?.instance?.instanceName ?? instanceName;

      await this.evolutionWhatsAppService.setPairingCodeMode(resolvedInstanceName);

      const integration = await this.organizationIntegrationsRepository.create(
        {
          organizationId: user.organizationId,
          channel: "whatsapp",
          provider: "evolution",
          instanceName: resolvedInstanceName,
          status: existingStatus ?? createdInstance?.instance?.status ?? "created",
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

  private async createCleanConnectionChallenge(
    integration: { id: string; instanceName: string },
    phoneNumber: string,
  ): Promise<WhatsAppConnectCode> {
    try {
      await this.preparePairingSession(integration.instanceName);
      const connectResult = await this.evolutionWhatsAppService.connect(integration.instanceName, phoneNumber);
      ensureConnectionChallengeReturned(connectResult);

      return connectResult;
    } catch (error: unknown) {
      await this.cleanupFailedPairingSession(integration);
      throw error;
    }
  }

  private async preparePairingSession(instanceName: string): Promise<void> {
    await this.bestEffortLogout(instanceName);
    await this.bestEffortRestart(instanceName);
    await this.evolutionWhatsAppService.setPairingCodeMode(instanceName);
  }

  private async cleanupFailedPairingSession(integration: { id: string; instanceName: string }): Promise<void> {
    await this.bestEffortLogout(integration.instanceName);
    await this.bestEffortRestart(integration.instanceName);
    await this.organizationIntegrationsRepository.updateStatus(integration.id, "connect_failed");
  }

  private async bestEffortLogout(instanceName: string): Promise<void> {
    try {
      await this.evolutionWhatsAppService.logoutInstance(instanceName);
    } catch {
      return;
    }
  }

  private async bestEffortRestart(instanceName: string): Promise<void> {
    try {
      await this.evolutionWhatsAppService.restartInstance(instanceName);
    } catch {
      return;
    }
  }

  private async findExistingWhatsAppInstanceState(instanceName: string): Promise<string | null> {
    try {
      const status = await this.evolutionWhatsAppService.getStatus(instanceName);
      return status.state ?? "created";
    } catch {
      return null;
    }
  }
}
