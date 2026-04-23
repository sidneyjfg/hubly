import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Unique } from "typeorm";

import { AuditEventEntity } from "./audit-event.entity";
import { ClinicEntity } from "./clinic.entity";
import { AppointmentEntity } from "./appointment.entity";
import { AuthSessionEntity } from "./auth-session.entity";

@Entity({ name: "users" })
@Unique("uq_users_clinic_email", ["clinicId", "email"])
export class UserEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 120 })
  public fullName!: string;

  @Column({ type: "varchar", length: 160 })
  public email!: string;

  @Column({ type: "varchar", length: 30 })
  public phone!: string;

  @Column({ type: "varchar", length: 32 })
  public role!: string;

  @Column({ type: "varchar", length: 255 })
  public passwordHash!: string;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => AuditEventEntity, (auditEvent) => auditEvent.actor)
  public auditEvents!: AuditEventEntity[];

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.createdBy)
  public createdAppointments!: AppointmentEntity[];

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  public sessions!: AuthSessionEntity[];
}
