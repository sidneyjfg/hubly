import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Unique } from "typeorm";

import { AuditEventEntity } from "./audit-event.entity";
import { OrganizationEntity } from "./organization.entity";
import { BookingEntity } from "./booking.entity";
import { AuthSessionEntity } from "./auth-session.entity";

@Entity({ name: "users" })
@Unique("uq_users_organization_email", ["organizationId", "email"])
export class UserEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

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

  @OneToMany(() => BookingEntity, (booking) => booking.createdBy)
  public createdBookings!: BookingEntity[];

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  public sessions!: AuthSessionEntity[];
}
