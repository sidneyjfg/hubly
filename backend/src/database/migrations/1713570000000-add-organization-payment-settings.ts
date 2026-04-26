import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationPaymentSettings1713570000000 implements MigrationInterface {
  public name = "AddOrganizationPaymentSettings1713570000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organization_payment_settings (
        organizationId varchar(36) NOT NULL,
        commissionRateBps int NOT NULL DEFAULT 1000,
        onlineDiscountBps int NOT NULL DEFAULT 500,
        absorbsProcessingFee boolean NOT NULL DEFAULT true,
        mercadoPagoConnected boolean NOT NULL DEFAULT false,
        mercadoPagoUserId varchar(120) NULL,
        mercadoPagoAccessToken varchar(1000) NULL,
        mercadoPagoRefreshToken varchar(1000) NULL,
        mercadoPagoTokenExpiresAt datetime NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (organizationId),
        CONSTRAINT fk_organization_payment_settings_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO organization_payment_settings (
        organizationId,
        commissionRateBps,
        onlineDiscountBps,
        absorbsProcessingFee,
        mercadoPagoConnected,
        mercadoPagoUserId,
        mercadoPagoAccessToken,
        mercadoPagoRefreshToken,
        mercadoPagoTokenExpiresAt
      )
      SELECT
        current_settings.organizationId,
        current_settings.commissionRateBps,
        current_settings.onlineDiscountBps,
        current_settings.absorbsProcessingFee,
        current_settings.mercadoPagoConnected,
        current_settings.mercadoPagoUserId,
        current_settings.mercadoPagoAccessToken,
        current_settings.mercadoPagoRefreshToken,
        current_settings.mercadoPagoTokenExpiresAt
      FROM provider_payment_settings current_settings
      INNER JOIN (
        SELECT organizationId, MIN(providerId) AS providerId
        FROM provider_payment_settings
        GROUP BY organizationId
      ) first_settings
        ON first_settings.organizationId = current_settings.organizationId
        AND first_settings.providerId = current_settings.providerId
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE organization_payment_settings");
  }
}
