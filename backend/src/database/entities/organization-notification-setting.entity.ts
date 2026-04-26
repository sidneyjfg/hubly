import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { OrganizationEntity } from "./organization.entity";

@Entity({ name: "organization_notification_settings" })
@Index("uq_organization_notification_settings_organization_channel", ["organizationId", "channel"], { unique: true })
export class OrganizationNotificationSettingEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.notificationSettings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 32 })
  public channel!: string;

  @Column({ type: "boolean", default: true })
  public isEnabled!: boolean;

  @Column({ type: "text" })
  public rulesJson!: string;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
