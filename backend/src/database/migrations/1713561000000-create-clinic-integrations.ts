import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClinicIntegrations1713561000000 implements MigrationInterface {
  public name = "CreateClinicIntegrations1713561000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinic_integrations (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        channel varchar(32) NOT NULL,
        provider varchar(32) NOT NULL,
        instanceName varchar(80) NOT NULL,
        status varchar(32) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_clinic_integrations_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT uq_clinic_integrations_clinic_channel UNIQUE (clinicId, channel)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE clinic_integrations`);
  }
}
