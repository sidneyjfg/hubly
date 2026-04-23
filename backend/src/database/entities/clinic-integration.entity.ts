import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { ClinicEntity } from "./clinic.entity";

@Entity({ name: "clinic_integrations" })
@Index("uq_clinic_integrations_clinic_channel", ["clinicId", "channel"], { unique: true })
export class ClinicIntegrationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.integrations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 32 })
  public channel!: string;

  @Column({ type: "varchar", length: 32 })
  public provider!: string;

  @Column({ type: "varchar", length: 80 })
  public instanceName!: string;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  public phoneNumber!: string | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
