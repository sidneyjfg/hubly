import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ClinicNotificationSettingEntity } from "../database/entities";
import type { WhatsAppReminderRule, WhatsAppReminderSettings } from "../types/notification";

type UpsertWhatsAppSettingsInput = {
  clinicId: string;
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

const defaultSettings = (clinicId: string): WhatsAppReminderSettings => ({
  clinicId,
  channel: "whatsapp",
  isEnabled: false,
  reminders: [],
});

export class ClinicNotificationSettingsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ClinicNotificationSettingEntity);
  }

  public async findWhatsAppByClinic(
    clinicId: string,
    manager?: EntityManager,
  ): Promise<WhatsAppReminderSettings> {
    const item = await this.getRepository(manager).findOne({
      where: {
        clinicId,
        channel: "whatsapp",
      },
    });

    if (!item) {
      return defaultSettings(clinicId);
    }

    return {
      clinicId: item.clinicId,
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
        clinicId: input.clinicId,
        channel: "whatsapp",
      },
    });

    const savedItem = await repository.save({
      id: currentItem?.id ?? randomUUID(),
      clinicId: input.clinicId,
      channel: "whatsapp",
      isEnabled: input.isEnabled,
      rulesJson: JSON.stringify(input.reminders),
    });

    return {
      clinicId: savedItem.clinicId,
      channel: "whatsapp",
      isEnabled: savedItem.isEnabled,
      reminders: JSON.parse(savedItem.rulesJson) as WhatsAppReminderRule[],
    };
  }
}
