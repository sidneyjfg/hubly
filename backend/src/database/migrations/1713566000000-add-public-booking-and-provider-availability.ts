import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublicBookingAndProviderAvailability1713566000000 implements MigrationInterface {
  public name = "AddPublicBookingAndProviderAvailability1713566000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organizations ADD bookingPageSlug varchar(160) NULL`);
    await queryRunner.query(`UPDATE organizations SET bookingPageSlug = LOWER(REPLACE(tradeName, ' ', '-')) WHERE bookingPageSlug IS NULL`);
    await queryRunner.query(`ALTER TABLE organizations MODIFY bookingPageSlug varchar(160) NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_organizations_booking_page_slug ON organizations (bookingPageSlug)`);

    await queryRunner.query(`
      CREATE TABLE provider_availabilities (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        weekday int NOT NULL,
        workStart varchar(5) NOT NULL,
        workEnd varchar(5) NOT NULL,
        lunchStart varchar(5) NULL,
        lunchEnd varchar(5) NULL,
        isActive boolean NOT NULL DEFAULT true,
        PRIMARY KEY (id),
        CONSTRAINT uq_provider_availabilities_provider_weekday UNIQUE (providerId, weekday),
        CONSTRAINT fk_provider_availabilities_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_provider_availabilities_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_provider_availabilities_organization_provider ON provider_availabilities (organizationId, providerId)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_provider_availabilities_organization_provider ON provider_availabilities`);
    await queryRunner.query(`DROP TABLE provider_availabilities`);
    await queryRunner.query(`DROP INDEX uq_organizations_booking_page_slug ON organizations`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN bookingPageSlug`);
  }
}
