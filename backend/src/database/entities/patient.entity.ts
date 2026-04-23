import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { AppointmentEntity } from "./appointment.entity";
import { ClinicEntity } from "./clinic.entity";

@Entity({ name: "patients" })
@Index("idx_patients_clinic_id", ["clinicId"])
export class PatientEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.patients, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 120 })
  public fullName!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  public email!: string | null;

  @Column({ type: "varchar", length: 30 })
  public phone!: string;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.patient)
  public appointments!: AppointmentEntity[];
}
