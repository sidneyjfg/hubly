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
