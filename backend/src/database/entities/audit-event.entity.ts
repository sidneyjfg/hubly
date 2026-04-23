import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ClinicEntity } from "./clinic.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "audit_events" })
@Index("idx_audit_events_clinic_occurred_at", ["clinicId", "occurredAt"])
export class AuditEventEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.auditEvents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 36, nullable: true })
  public actorId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.auditEvents, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "actorId" })
  public actor!: UserEntity | null;

  @Column({ type: "varchar", length: 80 })
  public action!: string;

  @Column({ type: "varchar", length: 60 })
  public targetType!: string;

  @Column({ type: "varchar", length: 36 })
  public targetId!: string;

  @Column({ type: "datetime" })
  public occurredAt!: Date;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;
}
