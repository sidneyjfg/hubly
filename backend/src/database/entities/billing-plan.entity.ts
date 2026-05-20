import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity({ name: "billing_plans" })
@Unique("uq_billing_plans_code_stripe_mode", ["code", "stripeMode"])
@Index("idx_billing_plans_stripe_mode_active", ["stripeMode", "isActive"])
export class BillingPlanEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 40 })
  public code!: string;

  @Column({ type: "varchar", length: 80 })
  public name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  public description!: string | null;

  @Column({ type: "int" })
  public amountCents!: number;

  @Column({ type: "varchar", length: 3, default: "brl" })
  public currency!: string;

  @Column({ type: "varchar", length: 20, default: "month" })
  public interval!: string;

  @Column({ type: "varchar", length: 10 })
  public stripeMode!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripeProductId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripePriceId!: string | null;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @Column({ type: "boolean", default: false })
  public isDefault!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
