import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarketplacePayments1713567000000 implements MigrationInterface {
  public name = "AddMarketplacePayments1713567000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bookings ADD paymentType varchar(20) NOT NULL DEFAULT 'presential'`);
    await queryRunner.query(`ALTER TABLE bookings ADD originalAmountCents int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE bookings ADD discountedAmountCents int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE bookings ADD onlineDiscountCents int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE bookings ADD platformCommissionRateBps int NOT NULL DEFAULT 1000`);
    await queryRunner.query(`ALTER TABLE bookings ADD platformCommissionCents int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE bookings ADD providerNetAmountCents int NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE bookings ADD paymentStatus varchar(32) NOT NULL DEFAULT 'pending_local'`);
    await queryRunner.query(`ALTER TABLE bookings ADD paymentCheckoutUrl varchar(500) NULL`);

    await queryRunner.query(`
      CREATE TABLE provider_payment_settings (
        providerId varchar(36) NOT NULL,
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
        PRIMARY KEY (providerId),
        CONSTRAINT fk_provider_payment_settings_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_provider_payment_settings_organization_id ON provider_payment_settings (organizationId)`,
    );

    await queryRunner.query(`
      CREATE TABLE payment_transactions (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        bookingId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        status varchar(32) NOT NULL,
        mercadoPagoPreferenceId varchar(120) NULL,
        mercadoPagoPaymentId varchar(120) NULL,
        originalAmountCents int NOT NULL,
        discountedAmountCents int NOT NULL,
        onlineDiscountCents int NOT NULL,
        platformCommissionRateBps int NOT NULL,
        platformCommissionCents int NOT NULL,
        providerNetAmountCents int NOT NULL,
        checkoutUrl varchar(500) NULL,
        rawGatewayPayload json NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_payment_transactions_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_payment_transactions_booking FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,
        CONSTRAINT fk_payment_transactions_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions (bookingId)`);
    await queryRunner.query(`CREATE INDEX idx_payment_transactions_mp_payment_id ON payment_transactions (mercadoPagoPaymentId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_payment_transactions_mp_payment_id ON payment_transactions`);
    await queryRunner.query(`DROP INDEX idx_payment_transactions_booking_id ON payment_transactions`);
    await queryRunner.query(`DROP TABLE payment_transactions`);
    await queryRunner.query(`DROP INDEX idx_provider_payment_settings_organization_id ON provider_payment_settings`);
    await queryRunner.query(`DROP TABLE provider_payment_settings`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN paymentCheckoutUrl`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN paymentStatus`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN providerNetAmountCents`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN platformCommissionCents`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN platformCommissionRateBps`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN onlineDiscountCents`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN discountedAmountCents`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN originalAmountCents`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN paymentType`);
  }
}
