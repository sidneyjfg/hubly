import type { MigrationInterface, QueryRunner } from "typeorm";

const bookingEventRules = JSON.stringify([
  { event: "created", isEnabled: true },
  { event: "confirmed", isEnabled: true },
  { event: "rescheduled", isEnabled: true },
  { event: "cancelled", isEnabled: true },
]);

export class BackfillStorefrontBookingEventAutomations1713578000000 implements MigrationInterface {
  public name = "BackfillStorefrontBookingEventAutomations1713578000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO organization_notification_settings (id, organizationId, channel, isEnabled, rulesJson, createdAt, updatedAt)
        SELECT
          UUID(),
          organizations.id,
          'booking_events',
          true,
          ?,
          NOW(),
          NOW()
        FROM organizations
        LEFT JOIN organization_notification_settings existing_setting
          ON existing_setting.organizationId = organizations.id
          AND existing_setting.channel = 'booking_events'
        WHERE organizations.isStorefrontPublished = true
          AND existing_setting.id IS NULL
      `,
      [bookingEventRules],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM organization_notification_settings
        WHERE channel = 'booking_events'
          AND isEnabled = true
          AND rulesJson = ?
      `,
      [bookingEventRules],
    );
  }
}
