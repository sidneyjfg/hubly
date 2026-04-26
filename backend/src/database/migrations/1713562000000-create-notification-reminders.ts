import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationReminders1713562000000 implements MigrationInterface {
  public name = "CreateNotificationReminders1713562000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organization_notification_settings (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        channel varchar(32) NOT NULL,
        isEnabled boolean NOT NULL DEFAULT false,
        rulesJson text NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT uq_organization_notification_settings_organization_channel UNIQUE (organizationId, channel),
        CONSTRAINT fk_organization_notification_settings_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE booking_notifications (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        bookingId varchar(36) NOT NULL,
        channel varchar(32) NOT NULL,
        status varchar(32) NOT NULL,
        scheduledFor datetime NOT NULL,
        hoursBefore int NOT NULL,
        customerPhone varchar(30) NOT NULL,
        message varchar(1000) NOT NULL,
        externalMessageId varchar(255) NULL,
        lastError varchar(255) NULL,
        sentAt datetime NULL,
        cancelledAt datetime NULL,
        failedAt datetime NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_booking_notifications_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_booking_notifications_booking FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_booking_notifications_organization_status_scheduled_for
      ON booking_notifications (organizationId, status, scheduledFor)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_booking_notifications_booking_channel
      ON booking_notifications (bookingId, channel)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_booking_notifications_booking_channel ON booking_notifications`);
    await queryRunner.query(`DROP INDEX idx_booking_notifications_organization_status_scheduled_for ON booking_notifications`);
    await queryRunner.query(`DROP TABLE booking_notifications`);
    await queryRunner.query(`DROP TABLE organization_notification_settings`);
  }
}
