import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationStorefront1713568000000 implements MigrationInterface {
  public name = "AddOrganizationStorefront1713568000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organizations ADD publicDescription varchar(500) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD publicPhone varchar(30) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD publicEmail varchar(160) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD addressLine varchar(180) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD addressNumber varchar(20) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD district varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD city varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD state varchar(2) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD postalCode varchar(12) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD coverImageUrl varchar(500) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD logoImageUrl varchar(500) NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD galleryImageUrls json NULL`);
    await queryRunner.query(`ALTER TABLE organizations ADD isStorefrontPublished boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN isStorefrontPublished`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN galleryImageUrls`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN logoImageUrl`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN coverImageUrl`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN postalCode`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN state`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN city`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN district`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN addressNumber`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN addressLine`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN publicEmail`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN publicPhone`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN publicDescription`);
  }
}
