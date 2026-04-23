import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPhoneColumn1713563000000 implements MigrationInterface {
  public name = "AddUserPhoneColumn1713563000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN phone varchar(30) NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN phone
    `);
  }
}
