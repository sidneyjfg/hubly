import type { FastifyInstance } from "fastify";
import type { Invoice } from "stripe/cjs/resources/Invoices";
import type { Subscription } from "stripe/cjs/resources/Subscriptions";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../src/app";
import { BillingPlanEntity, OrganizationSubscriptionEntity } from "../../../src/database/entities";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { BillingService } from "../../../src/services/billing.service";
import { env } from "../../../src/utils/env";
import { signInAsAdmin, signInAsProvider } from "../helpers/auth";

const originalBillingMode = env.STRIPE_BILLING_MODE;
const originalStripeSecretKey = env.STRIPE_SECRET_KEY;

const stripeMocks = vi.hoisted(() => ({
  checkoutSessionsCreate: vi.fn(),
  subscriptionsUpdate: vi.fn(),
  subscriptionsCancel: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: stripeMocks.checkoutSessionsCreate,
      },
    },
    subscriptions: {
      update: stripeMocks.subscriptionsUpdate,
      cancel: stripeMocks.subscriptionsCancel,
    },
  })),
}));

describe("Billing routes", () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeEach(async () => {
    env.STRIPE_BILLING_MODE = "test";
    env.STRIPE_SECRET_KEY = "sk_test_subscription";
    stripeMocks.checkoutSessionsCreate.mockResolvedValue({
      id: "cs_test_subscription",
      url: "https://checkout.stripe.test/session/cs_test_subscription",
    });
    stripeMocks.subscriptionsUpdate.mockResolvedValue({
      id: "sub_test_001",
      customer: "cus_test_001",
      status: "active",
      metadata: {
        organizationId: "cln_main_001",
        billingPlanId: "plan_pro_test",
      },
      items: {
        data: [
          {
            current_period_start: 1779060000,
            current_period_end: 1781652000,
            price: {
              id: "price_test_pro_6990",
            },
          },
        ],
      },
      trial_end: null,
      cancel_at_period_end: true,
    });
    stripeMocks.subscriptionsCancel.mockResolvedValue({
      id: "sub_test_001",
      customer: "cus_test_001",
      metadata: {
        organizationId: "cln_main_001",
      },
    });

    dataSource = await createTestDataSource();
    app = buildApp({
      dataSource,
    });
    await app.ready();
  });

  afterEach(async () => {
    env.STRIPE_BILLING_MODE = originalBillingMode;
    env.STRIPE_SECRET_KEY = originalStripeSecretKey;

    if (app) {
      await app.close();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    await requestProtection.reset();
    vi.clearAllMocks();
  });

  it("lets the organization administrator view the current plan and start checkout for a paid plan", async () => {
    const headers = await signInAsAdmin(app);

    await dataSource.getRepository(BillingPlanEntity).save([
      {
        id: "plan_free_test",
        code: "free",
        name: "Gratuito",
        description: "Plano gratuito Hubly",
        amountCents: 0,
        currency: "brl",
        interval: "month",
        stripeMode: "test",
        stripeProductId: null,
        stripePriceId: null,
        isActive: true,
        isDefault: true,
      },
      {
        id: "plan_pro_test",
        code: "pro",
        name: "Pro",
        description: "Plano Pro Hubly",
        amountCents: 6990,
        currency: "brl",
        interval: "month",
        stripeMode: "test",
        stripeProductId: "prod_test_pro",
        stripePriceId: "price_test_pro_6990",
        isActive: true,
        isDefault: false,
      },
      {
        id: "plan_premium_test",
        code: "premium",
        name: "Premium",
        description: "Plano Premium Hubly",
        amountCents: 12990,
        currency: "brl",
        interval: "month",
        stripeMode: "test",
        stripeProductId: "prod_test_premium",
        stripePriceId: "price_test_premium_12990",
        isActive: true,
        isDefault: false,
      },
    ]);

    const overviewResponse = await app.inject({
      method: "GET",
      url: "/v1/organization/subscription",
      headers,
    });

    expect(overviewResponse.statusCode).toBe(200);
    expect(overviewResponse.json()).toEqual(
      expect.objectContaining({
        stripeBillingMode: "test",
        current: expect.objectContaining({
          status: "active",
          stripeMode: "test",
          plan: expect.objectContaining({
            code: "free",
            amountCents: 0,
          }),
        }),
        plans: expect.arrayContaining([
          expect.objectContaining({
            code: "free",
            amountCents: 0,
          }),
          expect.objectContaining({
            code: "pro",
            amountCents: 6990,
          }),
          expect.objectContaining({
            code: "premium",
            amountCents: 12990,
          }),
        ]),
      }),
    );

    const directChangeResponse = await app.inject({
      method: "PATCH",
      url: "/v1/organization/subscription",
      headers,
      payload: {
        planCode: "premium",
      },
    });

    expect(directChangeResponse.statusCode).toBe(409);

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/organization/subscription/checkout",
      headers,
      payload: {
        planCode: "premium",
      },
    });

    expect(checkoutResponse.statusCode).toBe(200);
    expect(checkoutResponse.json()).toEqual({
      checkoutUrl: "https://checkout.stripe.test/session/cs_test_subscription",
    });
    expect(stripeMocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        allow_promotion_codes: true,
        line_items: [
          {
            price: "price_test_premium_12990",
            quantity: 1,
          },
        ],
        metadata: expect.objectContaining({
          billingPlanId: "plan_premium_test",
          kind: "hubly_subscription",
          organizationId: "cln_main_001",
          planCode: "premium",
        }),
      }),
    );
  });

  it("blocks providers from changing the organization subscription", async () => {
    const headers = await signInAsProvider(app);

    const readResponse = await app.inject({
      method: "GET",
      url: "/v1/organization/subscription",
      headers,
    });
    expect(readResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "PATCH",
      url: "/v1/organization/subscription",
      headers,
      payload: {
        planCode: "premium",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("schedules an active paid subscription cancellation for the end of the billing period", async () => {
    const headers = await signInAsAdmin(app);
    await dataSource.getRepository(BillingPlanEntity).save({
      id: "plan_pro_test",
      code: "pro",
      name: "Pro",
      description: "Plano Pro Hubly",
      amountCents: 6990,
      currency: "brl",
      interval: "month",
      stripeMode: "test",
      stripeProductId: "prod_test_pro",
      stripePriceId: "price_test_pro_6990",
      isActive: true,
      isDefault: false,
    });
    await dataSource.getRepository(OrganizationSubscriptionEntity).save({
      id: "sub_local_paid_001",
      organizationId: "cln_main_001",
      billingPlanId: "plan_pro_test",
      status: "active",
      stripeMode: "test",
      stripeCustomerId: "cus_test_001",
      stripeSubscriptionId: "sub_test_001",
      stripeCheckoutSessionId: "cs_test_subscription",
      stripePriceId: "price_test_pro_6990",
      trialEndsAt: null,
      currentPeriodStart: new Date("2026-05-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/organization/subscription/cancel",
      headers,
    });

    expect(response.statusCode).toBe(200);
    expect(stripeMocks.subscriptionsUpdate).toHaveBeenCalledWith("sub_test_001", {
      cancel_at_period_end: true,
    });
    expect(stripeMocks.subscriptionsCancel).not.toHaveBeenCalled();
    expect(response.json()).toEqual(
      expect.objectContaining({
        billingPlanId: "plan_pro_test",
        status: "active",
        stripeSubscriptionId: "sub_test_001",
        stripeCheckoutSessionId: "cs_test_subscription",
        stripePriceId: "price_test_pro_6990",
        cancelAtPeriodEnd: true,
        plan: expect.objectContaining({
          code: "pro",
        }),
      }),
    );
  });

  it("creates checkout for a paid plan change and cancels the previous paid subscription only after checkout succeeds", async () => {
    const headers = await signInAsAdmin(app);
    await dataSource.getRepository(BillingPlanEntity).save([
      {
        id: "plan_pro_test",
        code: "pro",
        name: "Pro",
        description: "Plano Pro Hubly",
        amountCents: 6990,
        currency: "brl",
        interval: "month",
        stripeMode: "test",
        stripeProductId: "prod_test_pro",
        stripePriceId: "price_test_pro_6990",
        isActive: true,
        isDefault: false,
      },
      {
        id: "plan_premium_test",
        code: "premium",
        name: "Premium",
        description: "Plano Premium Hubly",
        amountCents: 12990,
        currency: "brl",
        interval: "month",
        stripeMode: "test",
        stripeProductId: "prod_test_premium",
        stripePriceId: "price_test_premium_12990",
        isActive: true,
        isDefault: false,
      },
    ]);
    await dataSource.getRepository(OrganizationSubscriptionEntity).save({
      id: "sub_local_paid_002",
      organizationId: "cln_main_001",
      billingPlanId: "plan_pro_test",
      status: "active",
      stripeMode: "test",
      stripeCustomerId: "cus_test_001",
      stripeSubscriptionId: "sub_old_pro",
      stripeCheckoutSessionId: "cs_test_old",
      stripePriceId: "price_test_pro_6990",
      trialEndsAt: null,
      currentPeriodStart: new Date("2026-05-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
    });

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/organization/subscription/checkout",
      headers,
      payload: {
        planCode: "premium",
      },
    });

    expect(checkoutResponse.statusCode).toBe(200);
    expect(stripeMocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_test_001",
        line_items: [
          {
            price: "price_test_premium_12990",
            quantity: 1,
          },
        ],
      }),
    );
    expect(stripeMocks.subscriptionsCancel).not.toHaveBeenCalled();

    await new BillingService(dataSource).handleSubscriptionCheckoutCompleted({
      id: "cs_test_new_premium",
      customer: "cus_test_001",
      subscription: "sub_new_premium",
      metadata: {
        kind: "hubly_subscription",
        organizationId: "cln_main_001",
        billingPlanId: "plan_premium_test",
        planCode: "premium",
      },
    } as unknown as import("stripe/cjs/resources/Checkout/Sessions").Session);

    expect(stripeMocks.subscriptionsCancel).toHaveBeenCalledWith("sub_old_pro", {
      invoice_now: false,
      prorate: false,
    });
    let subscription = await dataSource.getRepository(OrganizationSubscriptionEntity).findOneOrFail({
      where: {
        organizationId: "cln_main_001",
        stripeMode: "test",
      },
      order: {
        updatedAt: "DESC",
      },
    });
    expect(subscription.billingPlanId).toBe("plan_premium_test");
    expect(subscription.stripeSubscriptionId).toBe("sub_new_premium");
    expect(subscription.stripePriceId).toBe("price_test_premium_12990");

    await new BillingService(dataSource).handleSubscriptionDeleted({
      id: "sub_old_pro",
      customer: "cus_test_001",
      metadata: {
        organizationId: "cln_main_001",
      },
    } as unknown as Subscription);

    subscription = await dataSource.getRepository(OrganizationSubscriptionEntity).findOneOrFail({
      where: {
        organizationId: "cln_main_001",
        stripeMode: "test",
      },
      order: {
        updatedAt: "DESC",
      },
    });
    expect(subscription.billingPlanId).toBe("plan_premium_test");
    expect(subscription.stripeSubscriptionId).toBe("sub_new_premium");
  });

  it("syncs subscription lifecycle events from Stripe webhooks", async () => {
    await dataSource.getRepository(BillingPlanEntity).save({
      id: "plan_pro_test",
      code: "pro",
      name: "Pro",
      description: "Plano Pro Hubly",
      amountCents: 6990,
      currency: "brl",
      interval: "month",
      stripeMode: "test",
      stripeProductId: "prod_test_pro",
      stripePriceId: "price_test_pro_6990",
      isActive: true,
      isDefault: false,
    });

    const billingService = new BillingService(dataSource);
    await billingService.handleSubscriptionChanged({
      id: "sub_test_001",
      customer: "cus_test_001",
      status: "active",
      metadata: {
        organizationId: "cln_main_001",
        billingPlanId: "plan_pro_test",
      },
      items: {
        data: [
          {
            current_period_start: 1779060000,
            current_period_end: 1781652000,
            price: {
              id: "price_test_pro_6990",
            },
          },
        ],
      },
      trial_end: null,
      cancel_at_period_end: false,
    } as unknown as Subscription);

    let subscription = await dataSource.getRepository(OrganizationSubscriptionEntity).findOneByOrFail({
      organizationId: "cln_main_001",
      stripeMode: "test",
    });
    expect(subscription.billingPlanId).toBe("plan_pro_test");
    expect(subscription.status).toBe("active");
    expect(subscription.stripeCustomerId).toBe("cus_test_001");
    expect(subscription.stripeSubscriptionId).toBe("sub_test_001");
    expect(subscription.stripePriceId).toBe("price_test_pro_6990");

    await billingService.handleSubscriptionInvoicePaymentFailed({
      customer: "cus_test_001",
      parent: {
        subscription_details: {
          subscription: "sub_test_001",
        },
      },
      period_start: 1779060000,
      period_end: 1781652000,
    } as unknown as Invoice);

    subscription = await dataSource.getRepository(OrganizationSubscriptionEntity).findOneByOrFail({
      organizationId: "cln_main_001",
      stripeMode: "test",
    });
    expect(subscription.status).toBe("past_due");

    await billingService.handleSubscriptionInvoicePaid({
      customer: "cus_test_001",
      parent: {
        subscription_details: {
          subscription: "sub_test_001",
        },
      },
      period_start: 1779060000,
      period_end: 1781652000,
    } as unknown as Invoice);

    subscription = await dataSource.getRepository(OrganizationSubscriptionEntity).findOneByOrFail({
      organizationId: "cln_main_001",
      stripeMode: "test",
    });
    expect(subscription.status).toBe("active");

    await billingService.handleSubscriptionDeleted({
      id: "sub_test_001",
      customer: "cus_test_001",
      metadata: {
        organizationId: "cln_main_001",
      },
    } as unknown as Subscription);

    subscription = await dataSource.getRepository(OrganizationSubscriptionEntity).findOneByOrFail({
      organizationId: "cln_main_001",
      stripeMode: "test",
    });
    expect(subscription.billingPlanId).toBe("plan_free_test");
    expect(subscription.status).toBe("active");
    expect(subscription.stripeCustomerId).toBe("cus_test_001");
    expect(subscription.stripeSubscriptionId).toBeNull();
    expect(subscription.stripePriceId).toBeNull();
  });
});
