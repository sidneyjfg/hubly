import { env } from "../utils/env";
import { AppError } from "../utils/app-error";

type MercadoPagoTokenResponse = {
  access_token: string;
  refresh_token: string;
  user_id: number;
  expires_in: number;
};

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type MercadoPagoPaymentResponse = {
  id: number;
  status: "approved" | "pending" | "in_process" | "rejected" | "cancelled" | string;
  external_reference?: string;
  transaction_amount?: number;
};

const mercadoPagoApiBaseUrl = "https://api.mercadopago.com";

const centsToDecimal = (value: number): number => Number((value / 100).toFixed(2));

export class MercadoPagoService {
  public buildOAuthAuthorizationUrl(state: string): string {
    if (!env.MERCADO_PAGO_CLIENT_ID || !env.MERCADO_PAGO_REDIRECT_URI) {
      throw new AppError("payments.mercado_pago_not_configured", "Mercado Pago OAuth is not configured.", 500);
    }

    const params = new URLSearchParams({
      client_id: env.MERCADO_PAGO_CLIENT_ID,
      response_type: "code",
      platform_id: "mp",
      redirect_uri: env.MERCADO_PAGO_REDIRECT_URI,
      state,
    });

    return `https://auth.mercadopago.com.br/authorization?${params.toString()}`;
  }

  public async exchangeOAuthCode(code: string): Promise<MercadoPagoTokenResponse> {
    return this.request<MercadoPagoTokenResponse>("/oauth/token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.MERCADO_PAGO_CLIENT_ID,
        client_secret: env.MERCADO_PAGO_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: env.MERCADO_PAGO_REDIRECT_URI,
      }),
    });
  }

  public async createMarketplacePreference(input: {
    accessToken: string;
    bookingId: string;
    title: string;
    payerEmail?: string | null;
    amountCents: number;
    platformCommissionCents: number;
    notificationUrl: string;
  }): Promise<MercadoPagoPreferenceResponse> {
    return this.request<MercadoPagoPreferenceResponse>("/checkout/preferences", {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        external_reference: input.bookingId,
        marketplace_fee: centsToDecimal(input.platformCommissionCents),
        notification_url: input.notificationUrl,
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        items: [
          {
            id: input.bookingId,
            title: input.title,
            quantity: 1,
            currency_id: "BRL",
            unit_price: centsToDecimal(input.amountCents),
          },
        ],
        payment_methods: {
          installments: 6,
        },
      }),
    });
  }

  public async getPayment(accessToken: string, paymentId: string): Promise<MercadoPagoPaymentResponse> {
    return this.request<MercadoPagoPaymentResponse>(`/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    if (!env.MERCADO_PAGO_ENABLED) {
      throw new AppError("payments.mercado_pago_disabled", "Mercado Pago integration is disabled.", 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.MERCADO_PAGO_TIMEOUT_MS);

    try {
      const response = await fetch(`${mercadoPagoApiBaseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });

      const responseBody = await response.text();
      const parsedBody = responseBody ? JSON.parse(responseBody) as unknown : null;

      if (!response.ok) {
        throw new AppError("payments.mercado_pago_request_failed", "Mercado Pago request failed.", 502);
      }

      return parsedBody as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
