import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIntegrationPhoneNumber1713564000000 implements MigrationInterface {
  public name = "AddIntegrationPhoneNumber1713564000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE clinic_integrations
      ADD phoneNumber varchar(30) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE clinic_integrations
      DROP COLUMN phoneNumber
    `);
  }
}
