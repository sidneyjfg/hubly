import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { BillingPlanEntity } from "./billing-plan.entity";
import { OrganizationEntity } from "./organization.entity";

@Entity({ name: "organization_subscriptions" })
@Index("idx_organization_subscriptions_organization_id", ["organizationId"])
export class OrganizationSubscriptionEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 36 })
  public billingPlanId!: string;

  @ManyToOne(() => BillingPlanEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "billingPlanId" })
  public billingPlan!: BillingPlanEntity;

  @Column({ type: "varchar", length: 32, default: "active" })
  public status!: string;

  @Column({ type: "varchar", length: 10 })
  public stripeMode!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripeCustomerId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripeSubscriptionId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripeCheckoutSessionId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripePriceId!: string | null;

  @Column({ type: "datetime", nullable: true })
  public trialEndsAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  public currentPeriodStart!: Date | null;

  @Column({ type: "datetime", nullable: true })
  public currentPeriodEnd!: Date | null;

  @Column({ type: "boolean", default: false })
  public cancelAtPeriodEnd!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
