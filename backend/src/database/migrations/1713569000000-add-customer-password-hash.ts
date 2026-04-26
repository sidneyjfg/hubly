import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerPasswordHash1713569000000 implements MigrationInterface {
  public name = "AddCustomerPasswordHash1713569000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers ADD passwordHash varchar(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN passwordHash`);
  }
}
