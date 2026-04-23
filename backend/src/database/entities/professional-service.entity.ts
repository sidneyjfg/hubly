import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { AppointmentEntity } from "./appointment.entity";
import { ClinicEntity } from "./clinic.entity";
import { ProfessionalEntity } from "./professional.entity";

@Entity({ name: "professional_services" })
@Index("idx_professional_services_clinic_professional", ["clinicId", "professionalId"])
export class ProfessionalServiceEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 36 })
  public professionalId!: string;

  @ManyToOne(() => ProfessionalEntity, (professional) => professional.services, { onDelete: "CASCADE" })
  @JoinColumn({ name: "professionalId" })
  public professional!: ProfessionalEntity;

  @Column({ type: "varchar", length: 120 })
  public name!: string;

  @Column({ type: "int" })
  public durationMinutes!: number;

  @Column({ type: "int", nullable: true })
  public priceCents!: number | null;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.service)
  public appointments!: AppointmentEntity[];
}
