import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { OrganizationNotificationSettingEntity } from "../database/entities";
import type {
  RelationshipAutomationSettings,
  RelationshipCampaign,
  WhatsAppReminderRule,
  WhatsAppReminderSettings,
} from "../types/notification";

type UpsertWhatsAppSettingsInput = {
  organizationId: string;
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

type UpsertRelationshipSettingsInput = {
  organizationId: string;
  isEnabled: boolean;
  campaigns: RelationshipCampaign[];
};

const defaultSettings = (organizationId: string): WhatsAppReminderSettings => ({
  organizationId,
  channel: "whatsapp",
  isEnabled: false,
  reminders: [],
});

const defaultRelationshipSettings = (organizationId: string): RelationshipAutomationSettings => ({
  organizationId,
  channel: "relationship",
  isEnabled: false,
  campaigns: [],
});

export class OrganizationNotificationSettingsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(OrganizationNotificationSettingEntity);
  }

  public async findWhatsAppByOrganization(
    organizationId: string,
    manager?: EntityManager,
  ): Promise<WhatsAppReminderSettings> {
    const item = await this.getRepository(manager).findOne({
      where: {
        organizationId,
        channel: "whatsapp",
      },
    });

    if (!item) {
      return defaultSettings(organizationId);
    }

    return {
      organizationId: item.organizationId,
      channel: "whatsapp",
      isEnabled: item.isEnabled,
      reminders: JSON.parse(item.rulesJson) as WhatsAppReminderRule[],
    };
  }

  public async upsertWhatsAppSettings(
    input: UpsertWhatsAppSettingsInput,
    manager?: EntityManager,
  ): Promise<WhatsAppReminderSettings> {
    const repository = this.getRepository(manager);
    const currentItem = await repository.findOne({
      where: {
        organizationId: input.organizationId,
        channel: "whatsapp",
      },
    });

    const savedItem = await repository.save({
      id: currentItem?.id ?? randomUUID(),
      organizationId: input.organizationId,
      channel: "whatsapp",
      isEnabled: input.isEnabled,
      rulesJson: JSON.stringify(input.reminders),
    });

    return {
      organizationId: savedItem.organizationId,
      channel: "whatsapp",
      isEnabled: savedItem.isEnabled,
      reminders: JSON.parse(savedItem.rulesJson) as WhatsAppReminderRule[],
    };
  }

  public async findRelationshipByOrganization(
    organizationId: string,
    manager?: EntityManager,
  ): Promise<RelationshipAutomationSettings> {
    const item = await this.getRepository(manager).findOne({
      where: {
        organizationId,
        channel: "relationship",
      },
    });

    if (!item) {
      return defaultRelationshipSettings(organizationId);
    }

    return {
      organizationId: item.organizationId,
      channel: "relationship",
      isEnabled: item.isEnabled,
      campaigns: JSON.parse(item.rulesJson) as RelationshipCampaign[],
    };
  }

  public async upsertRelationshipSettings(
    input: UpsertRelationshipSettingsInput,
    manager?: EntityManager,
  ): Promise<RelationshipAutomationSettings> {
    const repository = this.getRepository(manager);
    const currentItem = await repository.findOne({
      where: {
        organizationId: input.organizationId,
        channel: "relationship",
      },
    });

    const savedItem = await repository.save({
      id: currentItem?.id ?? randomUUID(),
      organizationId: input.organizationId,
      channel: "relationship",
      isEnabled: input.isEnabled,
      rulesJson: JSON.stringify(input.campaigns),
    });

    return {
      organizationId: savedItem.organizationId,
      channel: "relationship",
      isEnabled: savedItem.isEnabled,
      campaigns: JSON.parse(savedItem.rulesJson) as RelationshipCampaign[],
    };
  }
}
