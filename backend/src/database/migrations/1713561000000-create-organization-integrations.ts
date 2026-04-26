import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationIntegrations1713561000000 implements MigrationInterface {
  public name = "CreateOrganizationIntegrations1713561000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organization_integrations (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        channel varchar(32) NOT NULL,
        provider varchar(32) NOT NULL,
        instanceName varchar(80) NOT NULL,
        status varchar(32) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_organization_integrations_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT uq_organization_integrations_organization_channel UNIQUE (organizationId, channel)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE organization_integrations`);
  }
}
