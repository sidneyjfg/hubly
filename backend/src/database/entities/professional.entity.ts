import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { AppointmentEntity } from "./appointment.entity";
import { ClinicEntity } from "./clinic.entity";
import { ProfessionalServiceEntity } from "./professional-service.entity";

@Entity({ name: "professionals" })
@Index("idx_professionals_clinic_id", ["clinicId"])
export class ProfessionalEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.professionals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 120 })
  public fullName!: string;

  @Column({ type: "varchar", length: 120 })
  public specialty!: string;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.professional)
  public appointments!: AppointmentEntity[];

  @OneToMany(() => ProfessionalServiceEntity, (service) => service.professional)
  public services!: ProfessionalServiceEntity[];
}
