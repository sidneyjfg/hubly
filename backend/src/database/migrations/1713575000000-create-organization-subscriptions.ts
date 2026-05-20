import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationSubscriptions1713575000000 implements MigrationInterface {
  public name = "CreateOrganizationSubscriptions1713575000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organization_subscriptions (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        billingPlanId varchar(36) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'active',
        stripeMode varchar(10) NOT NULL,
        stripeCustomerId varchar(120) NULL,
        stripeSubscriptionId varchar(120) NULL,
        stripeCheckoutSessionId varchar(120) NULL,
        stripePriceId varchar(120) NULL,
        trialEndsAt datetime NULL,
        currentPeriodStart datetime NULL,
        currentPeriodEnd datetime NULL,
        cancelAtPeriodEnd boolean NOT NULL DEFAULT false,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_organization_subscriptions_organization_id (organizationId),
        CONSTRAINT fk_organization_subscriptions_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_organization_subscriptions_billing_plan FOREIGN KEY (billingPlanId) REFERENCES billing_plans(id) ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE organization_subscriptions");
  }
}
