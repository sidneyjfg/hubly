import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { BookingEntity } from "./booking.entity";
import { OrganizationEntity } from "./organization.entity";

@Entity({ name: "booking_notifications" })
@Index("idx_booking_notifications_organization_status_scheduled_for", ["organizationId", "status", "scheduledFor"])
@Index("idx_booking_notifications_booking_channel", ["bookingId", "channel"])
export class BookingNotificationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.bookingNotifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 36 })
  public bookingId!: string;

  @ManyToOne(() => BookingEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bookingId" })
  public booking!: BookingEntity;

  @Column({ type: "varchar", length: 32 })
  public channel!: string;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ type: "datetime" })
  public scheduledFor!: Date;

  @Column({ type: "int" })
  public hoursBefore!: number;

  @Column({ type: "varchar", length: 30 })
  public customerPhone!: string;

  @Column({ type: "varchar", length: 1000 })
  public message!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  public externalMessageId!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  public lastError!: string | null;

  @Column({ type: "datetime", nullable: true })
  public sentAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  public cancelledAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  public failedAt!: Date | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
