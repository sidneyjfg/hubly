import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { BookingEntity } from "./booking.entity";
import { BookingNotificationEntity } from "./booking-notification.entity";
import { AuditEventEntity } from "./audit-event.entity";
import { OrganizationIntegrationEntity } from "./organization-integration.entity";
import { OrganizationNotificationSettingEntity } from "./organization-notification-setting.entity";
import { CustomerEntity } from "./customer.entity";
import { ProviderEntity } from "./provider.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "organizations" })
export class OrganizationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 160 })
  public legalName!: string;

  @Column({ type: "varchar", length: 160 })
  public tradeName!: string;

  @Column({ type: "varchar", length: 160, unique: true })
  public bookingPageSlug!: string;

  @Column({ type: "varchar", length: 60 })
  public timezone!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  public publicDescription!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  public publicPhone!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  public publicEmail!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  public addressLine!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  public addressNumber!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public district!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public city!: string | null;

  @Column({ type: "varchar", length: 2, nullable: true })
  public state!: string | null;

  @Column({ type: "varchar", length: 12, nullable: true })
  public postalCode!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  public coverImageUrl!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  public logoImageUrl!: string | null;

  @Column({ type: "json", nullable: true })
  public galleryImageUrls!: string[] | null;

  @Column({ type: "boolean", default: false })
  public isStorefrontPublished!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => UserEntity, (user) => user.organization)
  public users!: UserEntity[];

  @OneToMany(() => ProviderEntity, (provider) => provider.organization)
  public providers!: ProviderEntity[];

  @OneToMany(() => CustomerEntity, (customer) => customer.organization)
  public customers!: CustomerEntity[];

  @OneToMany(() => BookingEntity, (booking) => booking.organization)
  public bookings!: BookingEntity[];

  @OneToMany(() => AuditEventEntity, (auditEvent) => auditEvent.organization)
  public auditEvents!: AuditEventEntity[];

  @OneToMany(() => OrganizationIntegrationEntity, (integration) => integration.organization)
  public integrations!: OrganizationIntegrationEntity[];

  @OneToMany(() => OrganizationNotificationSettingEntity, (setting) => setting.organization)
  public notificationSettings!: OrganizationNotificationSettingEntity[];

  @OneToMany(() => BookingNotificationEntity, (notification) => notification.organization)
  public bookingNotifications!: BookingNotificationEntity[];
}
