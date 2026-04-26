import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerStatusAndServiceOfferings1713565000000 implements MigrationInterface {
  public name = "AddCustomerStatusAndServiceOfferings1713565000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers ADD isActive boolean NOT NULL DEFAULT true`);

    await queryRunner.query(`
      CREATE TABLE service_offerings (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        name varchar(120) NOT NULL,
        durationMinutes int NOT NULL,
        priceCents int NULL,
        isActive boolean NOT NULL DEFAULT true,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_service_offerings_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_service_offerings_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_service_offerings_organization_provider ON service_offerings (organizationId, providerId)`,
    );

    await queryRunner.query(`ALTER TABLE bookings ADD offeringId varchar(36) NULL`);
    await queryRunner.query(
      `ALTER TABLE bookings ADD CONSTRAINT fk_bookings_offering FOREIGN KEY (offeringId) REFERENCES service_offerings(id) ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_offering`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN offeringId`);
    await queryRunner.query(`DROP INDEX idx_service_offerings_organization_provider ON service_offerings`);
    await queryRunner.query(`DROP TABLE service_offerings`);
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN isActive`);
  }
}
