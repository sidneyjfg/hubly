import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { ProviderEntity } from "./provider.entity";

@Entity({ name: "provider_payment_settings" })
@Index("idx_provider_payment_settings_organization_id", ["organizationId"])
export class ProviderPaymentSettingsEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public providerId!: string;

  @OneToOne(() => ProviderEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "providerId" })
  public provider!: ProviderEntity;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @Column({ type: "int", default: 0 })
  public commissionRateBps!: number;

  @Column({ type: "int", default: 500 })
  public onlineDiscountBps!: number;

  @Column({ type: "boolean", default: true })
  public absorbsProcessingFee!: boolean;

  @Column({ name: "stripe_charges_enabled", type: "boolean", default: false })
  public stripeChargesEnabled!: boolean;

  @Column({ name: "stripe_payouts_enabled", type: "boolean", default: false })
  public stripePayoutsEnabled!: boolean;

  @Column({ name: "stripe_details_submitted", type: "boolean", default: false })
  public stripeDetailsSubmitted!: boolean;

  @Column({ name: "stripe_currently_due", type: "json", nullable: true })
  public stripeCurrentlyDue!: string[] | null;

  @Column({ name: "stripe_eventually_due", type: "json", nullable: true })
  public stripeEventuallyDue!: string[] | null;

  @Column({ name: "stripe_past_due", type: "json", nullable: true })
  public stripePastDue!: string[] | null;

  @Column({ name: "stripe_disabled_reason", type: "varchar", length: 255, nullable: true })
  public stripeDisabledReason!: string | null;

  @Column({ name: "stripe_account_status", type: "varchar", length: 32, default: "pending" })
  public stripeAccountStatus!: string;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
