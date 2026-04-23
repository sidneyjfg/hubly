import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ClinicEntity } from "./clinic.entity";
import { PatientEntity } from "./patient.entity";
import { ProfessionalEntity } from "./professional.entity";
import { ProfessionalServiceEntity } from "./professional-service.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "appointments" })
@Index("idx_appointments_clinic_starts_at", ["clinicId", "startsAt"])
@Index("idx_appointments_professional_starts_at", ["professionalId", "startsAt"])
export class AppointmentEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.appointments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 36 })
  public professionalId!: string;

  @ManyToOne(() => ProfessionalEntity, (professional) => professional.appointments, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "professionalId" })
  public professional!: ProfessionalEntity;

  @Column({ type: "varchar", length: 36, nullable: true })
  public serviceId!: string | null;

  @ManyToOne(() => ProfessionalServiceEntity, (service) => service.appointments, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "serviceId" })
  public service!: ProfessionalServiceEntity | null;

  @Column({ type: "varchar", length: 36 })
  public patientId!: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.appointments, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "patientId" })
  public patient!: PatientEntity;

  @Column({ type: "varchar", length: 36, nullable: true })
  public createdByUserId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.createdAppointments, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "createdByUserId" })
  public createdBy!: UserEntity | null;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ type: "datetime" })
  public startsAt!: Date;

  @Column({ type: "datetime" })
  public endsAt!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  public notes!: string | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;
}
