import type { MigrationInterface, QueryRunner } from "typeorm";

export class AllowGlobalCustomerAccounts1713577000000 implements MigrationInterface {
  public name = "AllowGlobalCustomerAccounts1713577000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers DROP FOREIGN KEY fk_customers_organization`);
    await queryRunner.query(`ALTER TABLE customers MODIFY organizationId varchar(36) NULL`);
    await queryRunner.query(`
      ALTER TABLE customers
      ADD CONSTRAINT fk_customers_organization
      FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers DROP FOREIGN KEY fk_customers_organization`);
    await queryRunner.query(`ALTER TABLE customers MODIFY organizationId varchar(36) NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE customers
      ADD CONSTRAINT fk_customers_organization
      FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    `);
  }
}
