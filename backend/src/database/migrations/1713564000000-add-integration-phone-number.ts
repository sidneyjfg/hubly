import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIntegrationPhoneNumber1713564000000 implements MigrationInterface {
  public name = "AddIntegrationPhoneNumber1713564000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_integrations
      ADD phoneNumber varchar(30) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_integrations
      DROP COLUMN phoneNumber
    `);
  }
}
