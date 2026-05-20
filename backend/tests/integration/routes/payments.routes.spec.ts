import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../src/app";
import { BookingEntity, FinancialLedgerEntity, PaymentTransactionEntity, ProviderEntity } from "../../../src/database/entities";
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

  it("simulates Stripe setup and online booking payment without platform commission", async () => {
    const headers = await signInAsAdmin(app);

    const settingsResponse = await app.inject({
      method: "PATCH",
      url: "/v1/organization/payment-settings",
      headers,
      payload: {
        onlineDiscountBps: 0,
        absorbsProcessingFee: true,
      },
    });
    expect(settingsResponse.statusCode).toBe(200);

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
    expect(bookingResponse.statusCode).toBe(201);
    expect(bookingResponse.json()).toEqual(
      expect.objectContaining({
        organizationId: "cln_main_001",
        providerId: "pro_001",
        offeringId: "svc_001",
        status: "payment_pending",
        paymentType: "online",
        paymentStatus: "pending",
        originalAmountCents: 18000,
        discountedAmountCents: 18000,
        platformCommissionRateBps: 0,
        platformCommissionCents: 0,
        providerNetAmountCents: 18000,
        paymentClientSecret: "pi_booking_001_secret_test",
      }),
    );

    const createdPaymentIntent = stripeMocks.paymentIntentsCreate.mock.calls[0]?.[0];
    const createdPaymentIntentOptions = stripeMocks.paymentIntentsCreate.mock.calls[0]?.[1];
    expect(createdPaymentIntent).toEqual(
      expect.objectContaining({
        amount: 18000,
        currency: "brl",
        metadata: expect.objectContaining({
          bookingId: bookingResponse.json().id,
          organizationId: "cln_main_001",
          providerId: "pro_001",
        }),
      }),
    );
    expect(createdPaymentIntentOptions).toEqual({
      idempotencyKey: `payment_intent:${bookingResponse.json().id}`,
      stripeAccount: "acct_provider_001",
    });

    stripeMocks.webhooksConstructEvent.mockReturnValue({
      id: "evt_payment_succeeded_001",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_booking_001",
          amount: 18000,
          currency: "brl",
          application_fee_amount: null,
          transfer_data: null,
          metadata: {
            bookingId: bookingResponse.json().id,
            organizationId: "cln_main_001",
            providerId: "pro_001",
          },
          latest_charge: "ch_booking_001",
          status: "succeeded",
        },
      },
      account: "acct_provider_001",
    });

    const webhookResponse = await app.inject({
      method: "POST",
      url: "/v1/public/payments/stripe/webhooks",
      headers: {
        "stripe-signature": "valid_test_signature",
      },
      payload: {
        id: "evt_payment_succeeded_001",
      },
    });
    expect(webhookResponse.statusCode).toBe(200);
    expect(webhookResponse.json()).toEqual({
      received: true,
      eventType: "payment_intent.succeeded",
    });

    const booking = await dataSource.getRepository(BookingEntity).findOneByOrFail({ id: bookingResponse.json().id });
    expect(booking.status).toBe("confirmed");
    expect(booking.paymentStatus).toBe("approved");

    const paymentTransaction = await dataSource.getRepository(PaymentTransactionEntity).findOneByOrFail({
      stripePaymentIntentId: "pi_booking_001",
    });
    expect(paymentTransaction.status).toBe("approved");
    expect(paymentTransaction.platformCommissionCents).toBe(0);
    expect(paymentTransaction.providerNetAmountCents).toBe(18000);

    const ledger = await dataSource.getRepository(FinancialLedgerEntity).find({
      where: {
        bookingId: booking.id,
      },
      order: {
        createdAt: "ASC",
      },
    });
    expect(ledger.map((entry) => entry.type)).toEqual(["payment_created", "payment_succeeded"]);
    expect(ledger[1]).toEqual(
      expect.objectContaining({
        providerId: "pro_001",
        stripeAccountId: "acct_provider_001",
        stripeObjectId: "pi_booking_001",
        stripeEventId: "evt_payment_succeeded_001",
        amountCents: 18000,
        currency: "brl",
        status: "approved",
      }),
    );

    const provider = await dataSource.getRepository(ProviderEntity).findOneByOrFail({ id: "pro_001" });
    expect(provider.stripeAccountId).toBe("acct_provider_001");
  });
});
