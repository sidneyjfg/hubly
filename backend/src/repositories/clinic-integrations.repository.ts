import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ClinicIntegrationEntity } from "../database/entities";

export type ClinicIntegration = {
  id: string;
  clinicId: string;
  channel: "whatsapp";
  provider: "evolution";
  instanceName: string;
  status: string;
  phoneNumber: string | null;
};

type CreateClinicIntegrationInput = {
  clinicId: string;
  channel: "whatsapp";
  provider: "evolution";
  instanceName: string;
  status: string;
  phoneNumber?: string | null;
};

export class ClinicIntegrationsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ClinicIntegrationEntity);
  }

  public async findByClinicAndChannel(
    clinicId: string,
    channel: "whatsapp",
    manager?: EntityManager,
  ): Promise<ClinicIntegration | null> {
    const item = await this.getRepository(manager).findOne({
      where: {
        clinicId,
        channel,
      },
    });

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      clinicId: item.clinicId,
      channel: item.channel as "whatsapp",
      provider: item.provider as "evolution",
      instanceName: item.instanceName,
      status: item.status,
      phoneNumber: item.phoneNumber,
    };
  }

  public async create(
    input: CreateClinicIntegrationInput,
    manager?: EntityManager,
  ): Promise<ClinicIntegration> {
    const item = await this.getRepository(manager).save({
      id: randomUUID(),
      clinicId: input.clinicId,
      channel: input.channel,
      provider: input.provider,
      instanceName: input.instanceName,
      status: input.status,
      phoneNumber: input.phoneNumber ?? null,
    });

    return {
      id: item.id,
      clinicId: item.clinicId,
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
