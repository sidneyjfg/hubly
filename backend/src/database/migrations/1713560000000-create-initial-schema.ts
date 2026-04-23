import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1713560000000 implements MigrationInterface {
  public name = "CreateInitialSchema1713560000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinics (
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
        clinicId varchar(36) NOT NULL,
        fullName varchar(120) NOT NULL,
        email varchar(160) NOT NULL,
        phone varchar(30) NOT NULL,
        role varchar(32) NOT NULL,
        passwordHash varchar(255) NOT NULL,
        isActive boolean NOT NULL DEFAULT true,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT uq_users_clinic_email UNIQUE (clinicId, email),
        CONSTRAINT fk_users_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE professionals (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        fullName varchar(120) NOT NULL,
        specialty varchar(120) NOT NULL,
        isActive boolean NOT NULL DEFAULT true,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_professionals_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_professionals_clinic_id ON professionals (clinicId)`);

    await queryRunner.query(`
      CREATE TABLE patients (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        fullName varchar(120) NOT NULL,
        email varchar(160) NULL,
        phone varchar(30) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_patients_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_patients_clinic_id ON patients (clinicId)`);

    await queryRunner.query(`
      CREATE TABLE appointments (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        professionalId varchar(36) NOT NULL,
        patientId varchar(36) NOT NULL,
        createdByUserId varchar(36) NULL,
        status varchar(32) NOT NULL,
        startsAt datetime NOT NULL,
        endsAt datetime NOT NULL,
        notes varchar(255) NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_appointments_professional FOREIGN KEY (professionalId) REFERENCES professionals(id) ON DELETE RESTRICT,
        CONSTRAINT fk_appointments_patient FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE RESTRICT,
        CONSTRAINT fk_appointments_created_by FOREIGN KEY (createdByUserId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_appointments_clinic_starts_at ON appointments (clinicId, startsAt)`);
    await queryRunner.query(`CREATE INDEX idx_appointments_professional_starts_at ON appointments (professionalId, startsAt)`);

    await queryRunner.query(`
      CREATE TABLE audit_events (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        actorId varchar(36) NULL,
        action varchar(80) NOT NULL,
        targetType varchar(60) NOT NULL,
        targetId varchar(36) NOT NULL,
        occurredAt datetime NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_audit_events_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_audit_events_actor FOREIGN KEY (actorId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_audit_events_clinic_occurred_at ON audit_events (clinicId, occurredAt)`);

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
    await queryRunner.query(`DROP INDEX idx_audit_events_clinic_occurred_at ON audit_events`);
    await queryRunner.query(`DROP TABLE audit_events`);
    await queryRunner.query(`DROP INDEX idx_appointments_professional_starts_at ON appointments`);
    await queryRunner.query(`DROP INDEX idx_appointments_clinic_starts_at ON appointments`);
    await queryRunner.query(`DROP TABLE appointments`);
    await queryRunner.query(`DROP INDEX idx_patients_clinic_id ON patients`);
    await queryRunner.query(`DROP TABLE patients`);
    await queryRunner.query(`DROP INDEX idx_professionals_clinic_id ON professionals`);
    await queryRunner.query(`DROP TABLE professionals`);
    await queryRunner.query(`DROP TABLE users`);
    await queryRunner.query(`DROP TABLE clinics`);
  }
}
