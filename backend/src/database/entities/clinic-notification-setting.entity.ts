import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { ClinicEntity } from "./clinic.entity";

@Entity({ name: "clinic_notification_settings" })
@Index("uq_clinic_notification_settings_clinic_channel", ["clinicId", "channel"], { unique: true })
export class ClinicNotificationSettingEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.notificationSettings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

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
