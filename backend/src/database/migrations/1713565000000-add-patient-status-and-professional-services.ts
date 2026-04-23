import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatientStatusAndProfessionalServices1713565000000 implements MigrationInterface {
  public name = "AddPatientStatusAndProfessionalServices1713565000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE patients ADD isActive boolean NOT NULL DEFAULT true`);

    await queryRunner.query(`
      CREATE TABLE professional_services (
        id varchar(36) NOT NULL,
        clinicId varchar(36) NOT NULL,
        professionalId varchar(36) NOT NULL,
        name varchar(120) NOT NULL,
        durationMinutes int NOT NULL,
        priceCents int NULL,
        isActive boolean NOT NULL DEFAULT true,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_professional_services_clinic FOREIGN KEY (clinicId) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_professional_services_professional FOREIGN KEY (professionalId) REFERENCES professionals(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_professional_services_clinic_professional ON professional_services (clinicId, professionalId)`,
    );

    await queryRunner.query(`ALTER TABLE appointments ADD serviceId varchar(36) NULL`);
    await queryRunner.query(
      `ALTER TABLE appointments ADD CONSTRAINT fk_appointments_service FOREIGN KEY (serviceId) REFERENCES professional_services(id) ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE appointments DROP FOREIGN KEY fk_appointments_service`);
    await queryRunner.query(`ALTER TABLE appointments DROP COLUMN serviceId`);
    await queryRunner.query(`DROP INDEX idx_professional_services_clinic_professional ON professional_services`);
    await queryRunner.query(`DROP TABLE professional_services`);
    await queryRunner.query(`ALTER TABLE patients DROP COLUMN isActive`);
  }
}
