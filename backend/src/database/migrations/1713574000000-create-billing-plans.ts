import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBillingPlans1713574000000 implements MigrationInterface {
  public name = "CreateBillingPlans1713574000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE billing_plans (
        id varchar(36) NOT NULL,
        code varchar(40) NOT NULL,
        name varchar(80) NOT NULL,
        description varchar(255) NULL,
        amountCents int NOT NULL,
        currency varchar(3) NOT NULL DEFAULT 'brl',
        \`interval\` varchar(20) NOT NULL DEFAULT 'month',
        stripeMode varchar(10) NOT NULL,
        stripeProductId varchar(120) NULL,
        stripePriceId varchar(120) NULL,
        isActive boolean NOT NULL DEFAULT true,
        isDefault boolean NOT NULL DEFAULT false,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_billing_plans_code_stripe_mode (code, stripeMode),
        INDEX idx_billing_plans_stripe_mode_active (stripeMode, isActive)
      )
    `);

    await queryRunner.query(`
      INSERT INTO billing_plans (
        id,
        code,
        name,
        description,
        amountCents,
        currency,
        \`interval\`,
        stripeMode,
        stripeProductId,
        stripePriceId,
        isActive,
        isDefault
      ) VALUES
        ('plan_free_test', 'free', 'Gratuito', 'Plano gratuito Hubly para organizações existentes', 0, 'brl', 'month', 'test', NULL, NULL, true, true),
        ('plan_pro_test', 'pro', 'Pro', 'Plano Pro Hubly', 6990, 'brl', 'month', 'test', NULL, NULL, true, false),
        ('plan_premium_test', 'premium', 'Premium', 'Plano Premium Hubly', 12990, 'brl', 'month', 'test', NULL, NULL, true, false),
        ('plan_free_live', 'free', 'Gratuito', 'Plano gratuito Hubly para organizações existentes', 0, 'brl', 'month', 'live', NULL, NULL, true, true),
        ('plan_pro_live', 'pro', 'Pro', 'Plano Pro Hubly', 6990, 'brl', 'month', 'live', NULL, NULL, true, false),
        ('plan_premium_live', 'premium', 'Premium', 'Plano Premium Hubly', 12990, 'brl', 'month', 'live', NULL, NULL, true, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE billing_plans");
  }
}
