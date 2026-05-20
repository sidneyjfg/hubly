import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddFreeBillingPlanAndSeedSubscriptions1713576000000 implements MigrationInterface {
  public name = "AddFreeBillingPlanAndSeedSubscriptions1713576000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        ('plan_free_live', 'free', 'Gratuito', 'Plano gratuito Hubly para organizações existentes', 0, 'brl', 'month', 'live', NULL, NULL, true, true)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        amountCents = VALUES(amountCents),
        isActive = VALUES(isActive),
        isDefault = VALUES(isDefault)
    `);

    await queryRunner.query("UPDATE billing_plans SET isDefault = false WHERE code <> 'free'");

    await queryRunner.query(`
      UPDATE organization_subscriptions
      SET
        billingPlanId = 'plan_free_test',
        status = 'active',
        stripePriceId = NULL
      WHERE stripeMode = 'test'
        AND stripeSubscriptionId IS NULL
        AND stripeCheckoutSessionId IS NULL
    `);

    await queryRunner.query(`
      UPDATE organization_subscriptions
      SET
        billingPlanId = 'plan_free_live',
        status = 'active',
        stripePriceId = NULL
      WHERE stripeMode = 'live'
        AND stripeSubscriptionId IS NULL
        AND stripeCheckoutSessionId IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO organization_subscriptions (
        id,
        organizationId,
        billingPlanId,
        status,
        stripeMode,
        stripeCustomerId,
        stripeSubscriptionId,
        stripeCheckoutSessionId,
        stripePriceId,
        trialEndsAt,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd
      )
      SELECT
        UUID(),
        organizations.id,
        'plan_free_test',
        'active',
        'test',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false
      FROM organizations
      WHERE NOT EXISTS (
        SELECT 1
        FROM organization_subscriptions
        WHERE organization_subscriptions.organizationId = organizations.id
          AND organization_subscriptions.stripeMode = 'test'
      )
    `);

    await queryRunner.query(`
      INSERT INTO organization_subscriptions (
        id,
        organizationId,
        billingPlanId,
        status,
        stripeMode,
        stripeCustomerId,
        stripeSubscriptionId,
        stripeCheckoutSessionId,
        stripePriceId,
        trialEndsAt,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd
      )
      SELECT
        UUID(),
        organizations.id,
        'plan_free_live',
        'active',
        'live',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false
      FROM organizations
      WHERE NOT EXISTS (
        SELECT 1
        FROM organization_subscriptions
        WHERE organization_subscriptions.organizationId = organizations.id
          AND organization_subscriptions.stripeMode = 'live'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM organization_subscriptions WHERE billingPlanId IN ('plan_free_test', 'plan_free_live')");
    await queryRunner.query("DELETE FROM billing_plans WHERE id IN ('plan_free_test', 'plan_free_live')");
  }
}
