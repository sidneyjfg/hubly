import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationReminders1713562000000 implements MigrationInterface {
  public name = "CreateNotificationReminders1713562000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinic_notification_settings (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        channel varchar(32) NOT NULL,
        isEnabled boolean NOT NULL DEFAULT false,
        rulesJson text NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT uq_clinic_notification_settings_clinic_channel UNIQUE (clinicId, channel),
        CONSTRAINT fk_clinic_notification_settings_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE appointment_notifications (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        appointmentId varchar(36) NOT NULL,
        channel varchar(32) NOT NULL,
        status varchar(32) NOT NULL,
        scheduledFor datetime NOT NULL,
        hoursBefore int NOT NULL,
        patientPhone varchar(30) NOT NULL,
        message varchar(1000) NOT NULL,
        externalMessageId varchar(255) NULL,
        lastError varchar(255) NULL,
        sentAt datetime NULL,
        cancelledAt datetime NULL,
        failedAt datetime NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_appointment_notifications_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_appointment_notifications_appointment FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_appointment_notifications_clinic_status_scheduled_for
      ON appointment_notifications (clinicId, status, scheduledFor)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_appointment_notifications_appointment_channel
      ON appointment_notifications (appointmentId, channel)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_appointment_notifications_appointment_channel ON appointment_notifications`);
    await queryRunner.query(`DROP INDEX idx_appointment_notifications_clinic_status_scheduled_for ON appointment_notifications`);
    await queryRunner.query(`DROP TABLE appointment_notifications`);
    await queryRunner.query(`DROP TABLE clinic_notification_settings`);
  }
}
