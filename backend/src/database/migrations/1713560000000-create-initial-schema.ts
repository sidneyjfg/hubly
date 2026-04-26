import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1713560000000 implements MigrationInterface {
  public name = "CreateInitialSchema1713560000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organizations (
        id varchar(36) NOT NULL,
        legalName varchar(160) NOT NULL,
        tradeName varchar(160) NOT NULL,
        timezone varchar(60) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        fullName varchar(120) NOT NULL,
        email varchar(160) NOT NULL,
        role varchar(32) NOT NULL,
        passwordHash varchar(255) NOT NULL,
        isActive boolean NOT NULL DEFAULT true,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT uq_users_organization_email UNIQUE (organizationId, email),
        CONSTRAINT fk_users_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE providers (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        fullName varchar(120) NOT NULL,
        specialty varchar(120) NOT NULL,
        isActive boolean NOT NULL DEFAULT true,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_providers_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_providers_organization_id ON providers (organizationId)`);

    await queryRunner.query(`
      CREATE TABLE customers (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        fullName varchar(120) NOT NULL,
        email varchar(160) NULL,
        phone varchar(30) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_customers_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_customers_organization_id ON customers (organizationId)`);

    await queryRunner.query(`
      CREATE TABLE bookings (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        customerId varchar(36) NOT NULL,
        createdByUserId varchar(36) NULL,
        status varchar(32) NOT NULL,
        startsAt datetime NOT NULL,
        endsAt datetime NOT NULL,
        notes varchar(255) NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_bookings_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_bookings_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE RESTRICT,
        CONSTRAINT fk_bookings_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT,
        CONSTRAINT fk_bookings_created_by FOREIGN KEY (createdByUserId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_bookings_organization_starts_at ON bookings (organizationId, startsAt)`);
    await queryRunner.query(`CREATE INDEX idx_bookings_provider_starts_at ON bookings (providerId, startsAt)`);

    await queryRunner.query(`
      CREATE TABLE audit_events (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        actorId varchar(36) NULL,
        action varchar(80) NOT NULL,
        targetType varchar(60) NOT NULL,
        targetId varchar(36) NOT NULL,
        occurredAt datetime NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_audit_events_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_audit_events_actor FOREIGN KEY (actorId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_audit_events_organization_occurred_at ON audit_events (organizationId, occurredAt)`);

    await queryRunner.query(`
      CREATE TABLE auth_sessions (
        id varchar(36) NOT NULL,
        userId varchar(36) NOT NULL,
        refreshTokenHash varchar(255) NOT NULL,
        expiresAt datetime NOT NULL,
        revokedAt datetime NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_auth_sessions_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_auth_sessions_user_id ON auth_sessions (userId)`);
    await queryRunner.query(`CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions (expiresAt)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_auth_sessions_expires_at ON auth_sessions`);
    await queryRunner.query(`DROP INDEX idx_auth_sessions_user_id ON auth_sessions`);
    await queryRunner.query(`DROP TABLE auth_sessions`);
    await queryRunner.query(`DROP INDEX idx_audit_events_organization_occurred_at ON audit_events`);
    await queryRunner.query(`DROP TABLE audit_events`);
    await queryRunner.query(`DROP INDEX idx_bookings_provider_starts_at ON bookings`);
    await queryRunner.query(`DROP INDEX idx_bookings_organization_starts_at ON bookings`);
    await queryRunner.query(`DROP TABLE bookings`);
    await queryRunner.query(`DROP INDEX idx_customers_organization_id ON customers`);
    await queryRunner.query(`DROP TABLE customers`);
    await queryRunner.query(`DROP INDEX idx_providers_organization_id ON providers`);
    await queryRunner.query(`DROP TABLE providers`);
    await queryRunner.query(`DROP TABLE users`);
    await queryRunner.query(`DROP TABLE organizations`);
  }
}
