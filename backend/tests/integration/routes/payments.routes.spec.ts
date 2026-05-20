import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { requestProtection } from "../../../src/security/request-protection";
import { env } from "../../../src/utils/env";
import { signInAsAdmin, signInAsProvider } from "../helpers/auth";

const stripeMocks = vi.hoisted(() => ({
  accountsCreate: vi.fn(),
  accountsRetrieve: vi.fn(),
  accountLinksCreate: vi.fn(),
  paymentIntentsCreate: vi.fn(),
  webhooksConstructEvent: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    accounts: {
      create: stripeMocks.accountsCreate,
      retrieve: stripeMocks.accountsRetrieve,
    },
    accountLinks: {
      create: stripeMocks.accountLinksCreate,
    },
    paymentIntents: {
      create: stripeMocks.paymentIntentsCreate,
    },
    webhooks: {
      constructEvent: stripeMocks.webhooksConstructEvent,
    },
  })),
}));

const verifiedStripeAccount = {
  id: "acct_provider_001",
  charges_enabled: true,
  payouts_enabled: true,
  details_submitted: true,
  requirements: {
    currently_due: [],
    eventually_due: [],
    past_due: [],
    disabled_reason: null,
  },
};

describe("Payments routes", () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeEach(async () => {
    env.STRIPE_SECRET_KEY = "sk_test_subscription";
    env.STRIPE_WEBHOOK_SECRET = "whsec_subscription";

    stripeMocks.accountsCreate.mockResolvedValue(verifiedStripeAccount);
    stripeMocks.accountsRetrieve.mockResolvedValue(verifiedStripeAccount);
    stripeMocks.accountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.test/onboarding/acct_provider_001",
    });
    stripeMocks.paymentIntentsCreate.mockImplementation(async (payload, options) => ({
      id: "pi_booking_001",
      client_secret: "pi_booking_001_secret_test",
      amount: payload.amount,
      currency: payload.currency,
      application_fee_amount: null,
      transfer_data: null,
      metadata: payload.metadata,
      latest_charge: null,
      status: "requires_payment_method",
      idempotency_key: options?.idempotencyKey,
    }));
    stripeMocks.webhooksConstructEvent.mockReset();

    dataSource = await createTestDataSource();
    app = buildApp({
      dataSource,
    });
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    await requestProtection.reset();
    vi.clearAllMocks();
  });

  it("lets admin configure online discount without platform commission", async () => {
    const headers = await signInAsAdmin(app);

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/providers/pro_001/payment-settings",
      headers,
      payload: {
        // commissionRateBps: 500, // Ignored by the system now
        onlineDiscountBps: 700,
        absorbsProcessingFee: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual(
      expect.objectContaining({
        providerId: "pro_001",
        organizationId: "cln_main_001",
        commissionRateBps: 0,
        onlineDiscountBps: 700,
        absorbsProcessingFee: true,
        stripeAccountId: null,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
      }),
    );

    const getResponse = await app.inject({
      method: "GET",
      url: "/v1/providers/pro_001/payment-settings",
      headers,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().commissionRateBps).toBe(0);
  });

  it("prevents providers from accessing another provider's financial data", async () => {
    const headers = await signInAsProvider(app);
    const urls = [
      "/v1/providers/pro_001/stripe/balance",
      "/v1/providers/pro_001/stripe/account-status",
      "/v1/providers/pro_001/stripe/transactions",
      "/v1/providers/pro_001/stripe/payouts",
      "/v1/providers/pro_001/payment-settings",
    ];

    for (const url of urls) {
      const response = await app.inject({
        method: "GET",
        url,
        headers,
      });

      expect(response.statusCode).toBe(403);
    }
  });

  it("rejects invalid payout amounts before contacting Stripe", async () => {
    const headers = await signInAsProvider(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/providers/pro_002/stripe/payouts",
      headers,
      payload: {
        amountCents: 0,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects Stripe webhooks without a signature", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/public/payments/stripe/webhooks",
      payload: {
        id: "evt_invalid",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("does not accept online payment data when creating public bookings", async () => {
    const headers = await signInAsAdmin(app);

    const organizationAccountResponse = await app.inject({
      method: "POST",
      url: "/v1/organization/stripe/accounts",
      headers,
    });
    expect(organizationAccountResponse.statusCode).toBe(200);

    const accountResponse = await app.inject({
      method: "POST",
      url: "/v1/providers/pro_001/stripe/accounts",
      headers,
    });
    expect(accountResponse.statusCode).toBe(200);
    expect(accountResponse.json()).toEqual(
      expect.objectContaining({
        providerId: "pro_001",
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      }),
    );

    const onboardingResponse = await app.inject({
      method: "POST",
      url: "/v1/providers/pro_001/stripe/onboarding-links",
      headers,
    });
    expect(onboardingResponse.statusCode).toBe(200);
    expect(onboardingResponse.json()).toEqual({
      providerId: "pro_001",
      onboardingUrl: "https://connect.stripe.test/onboarding/acct_provider_001",
    });

    const accountStatusResponse = await app.inject({
      method: "GET",
      url: "/v1/providers/pro_001/stripe/account-status",
      headers,
    });
    expect(accountStatusResponse.statusCode).toBe(200);
    expect(accountStatusResponse.json()).toEqual(
      expect.objectContaining({
        providerId: "pro_001",
        status: "verified",
        canReceivePayments: true,
        canRequestPayouts: true,
      }),
    );

    const bookingResponse = await app.inject({
      method: "POST",
      url: "/v1/public/organizations/organizationa-exemplo/bookings",
      payload: {
        fullName: "Cliente Pagante",
        email: "cliente-pagante@test.local",
        phone: "+5511955512345",
        password: "password123",
        providerId: "pro_001",
        offeringId: "svc_001",
        startsAt: "2026-04-21T15:00:00.000Z",
        endsAt: "2026-04-21T15:30:00.000Z",
        paymentType: "online",
      },
    });
    expect(bookingResponse.statusCode).toBe(400);
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });
});
