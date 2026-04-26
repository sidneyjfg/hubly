import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { OrganizationEntity } from "./organization.entity";

@Entity({ name: "organization_payment_settings" })
export class OrganizationPaymentSettingsEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public organizationId!: string;

  @OneToOne(() => OrganizationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "int", default: 1000 })
  public commissionRateBps!: number;

  @Column({ type: "int", default: 500 })
  public onlineDiscountBps!: number;

  @Column({ type: "boolean", default: true })
  public absorbsProcessingFee!: boolean;

  @Column({ type: "boolean", default: false })
  public mercadoPagoConnected!: boolean;

  @Column({ type: "varchar", length: 120, nullable: true })
  public mercadoPagoUserId!: string | null;

  @Column({ type: "varchar", length: 1000, nullable: true })
  public mercadoPagoAccessToken!: string | null;

  @Column({ type: "varchar", length: 1000, nullable: true })
  public mercadoPagoRefreshToken!: string | null;

  @Column({ type: "datetime", nullable: true })
  public mercadoPagoTokenExpiresAt!: Date | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
