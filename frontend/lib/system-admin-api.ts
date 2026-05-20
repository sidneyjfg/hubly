"use client";

import { resolveApiBaseUrl } from "@/lib/api-client";
import type { Organization } from "@/lib/types";
import type { SystemAdminSession } from "@/store/system-admin-store";

export type SystemAdminSummary = {
  auditEvents: number;
  bookings: number;
  customers: number;
  tenants: number;
  users: number;
};

export type SystemAdminSubscriptionReadiness = {
  organizationId: string;
  organizationName: string;
  onlineRevenueCents: number;
  localRevenueCents: number;
  onlineCount: number;
  localCount: number;
  pendingStatusCount: number;
  localPaymentRatio: number;
};

export type SystemAdminAuditEvent = {
  action: string;
  actorId: string;
  id: string;
  occurredAt: string;
  organizationId: string;
  targetId: string;
  targetType: string;
};

export type SystemAdminBillingPlan = {
  id: string;
  code: "free" | "pro" | "premium" | string;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  interval: "month" | "year" | string;
  stripeMode: "test" | "live" | string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SystemAdminBillingPlansResponse = {
  stripeBillingMode: "test" | "live";
  items: SystemAdminBillingPlan[];
};

type PaginatedResponse<T> = {
  items: T[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type SystemAdminRequestOptions = {
  method?: "GET" | "PATCH" | "POST";
  body?: unknown;
  query?: Record<string, string | undefined>;
  session?: SystemAdminSession | null;
};

type ErrorResponse = {
  error?: {
    message?: string;
  };
  message?: string;
};

function buildSystemAdminUrl(path: string, query?: Record<string, string | undefined>): string {
  const url = new URL(path, resolveApiBaseUrl());

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function systemAdminRequest<T>(path: string, options: SystemAdminRequestOptions = {}): Promise<T> {
  const headers = new Headers();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.session) {
    headers.set("Authorization", `Bearer ${options.session.accessToken}`);
  }

  try {
    const response = await fetch(buildSystemAdminUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
      const message = payload?.error?.message ?? payload?.message ?? "Falha na comunicação com o painel do dono.";
      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Servidor não respondeu ao login do dono em até 10 segundos.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const systemAdminApi = {
  signIn(input: { email: string; password: string }) {
    return systemAdminRequest<SystemAdminSession>("/v1/system-admin/auth/sign-in", {
      method: "POST",
      body: input
    });
  },

  getSummary(session: SystemAdminSession) {
    return systemAdminRequest<SystemAdminSummary>("/v1/system-admin/summary", {
      session
    });
  },

  getTenants(session: SystemAdminSession, query: { limit?: number; page?: number } = {}) {
    return systemAdminRequest<PaginatedResponse<Organization>>("/v1/system-admin/tenants", {
      session,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  getAuditEvents(
    session: SystemAdminSession,
    query: { action?: string; limit?: number; organizationId?: string; page?: number } = {}
  ) {
    return systemAdminRequest<PaginatedResponse<SystemAdminAuditEvent>>("/v1/system-admin/audit/events", {
      session,
      query: {
        action: query.action,
        limit: query.limit?.toString(),
        organizationId: query.organizationId,
        page: query.page?.toString()
      }
    });
  },

  getSubscriptionReadiness(session: SystemAdminSession) {
    return systemAdminRequest<SystemAdminSubscriptionReadiness[]>("/v1/system-admin/subscription-readiness", {
      session
    });
  },

  getBillingPlans(session: SystemAdminSession) {
    return systemAdminRequest<SystemAdminBillingPlansResponse>("/v1/system-admin/billing/plans", {
      session
    });
  },

  updateBillingPlan(
    session: SystemAdminSession,
    id: string,
    input: Partial<Pick<SystemAdminBillingPlan, "amountCents" | "description" | "interval" | "isActive" | "isDefault" | "name" | "stripePriceId" | "stripeProductId">>
  ) {
    return systemAdminRequest<SystemAdminBillingPlan>(`/v1/system-admin/billing/plans/${id}`, {
      method: "PATCH",
      session,
      body: input
    });
  }
};
