import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { OrganizationIntegrationEntity } from "../database/entities";

export type OrganizationIntegration = {
  id: string;
  organizationId: string;
  channel: "whatsapp";
  provider: "evolution";
  instanceName: string;
  status: string;
  phoneNumber: string | null;
};

type CreateOrganizationIntegrationInput = {
  organizationId: string;
  channel: "whatsapp";
  provider: "evolution";
  instanceName: string;
  status: string;
  phoneNumber?: string | null;
};

export class OrganizationIntegrationsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(OrganizationIntegrationEntity);
  }

  public async findByOrganizationAndChannel(
    organizationId: string,
    channel: "whatsapp",
    manager?: EntityManager,
  ): Promise<OrganizationIntegration | null> {
    const item = await this.getRepository(manager).findOne({
      where: {
        organizationId,
        channel,
      },
    });

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      organizationId: item.organizationId,
      channel: item.channel as "whatsapp",
      provider: item.provider as "evolution",
      instanceName: item.instanceName,
      status: item.status,
      phoneNumber: item.phoneNumber,
    };
  }

  public async create(
    input: CreateOrganizationIntegrationInput,
    manager?: EntityManager,
  ): Promise<OrganizationIntegration> {
    const item = await this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      channel: input.channel,
      provider: input.provider,
      instanceName: input.instanceName,
      status: input.status,
      phoneNumber: input.phoneNumber ?? null,
    });

    return {
      id: item.id,
      organizationId: item.organizationId,
      channel: item.channel as "whatsapp",
      provider: item.provider as "evolution",
      instanceName: item.instanceName,
      status: item.status,
      phoneNumber: item.phoneNumber,
    };
  }

  public async updateStatus(
    id: string,
    status: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.getRepository(manager).update({ id }, { status });
  }

  public async updatePhoneNumber(
    id: string,
    phoneNumber: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    await this.getRepository(manager).update({ id }, { phoneNumber });
  }
}
