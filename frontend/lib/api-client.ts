"use client";

import { apiRoutes } from "@/lib/backend-contract";
import type { AuthSession } from "@/lib/types";
import { useFeedbackStore } from "@/store/feedback-store";
import { useAppStore } from "@/store/app-store";

const DEFAULT_API_PORT = "3333";
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";

function normalizeApiBaseUrl(value: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function resolveApiBaseUrl(): string {
  const normalizedBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);

  if (normalizedBaseUrl) {
    return normalizedBaseUrl;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_API_PORT}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
  headers?: Record<string, string>;
  query?: Record<string, string | undefined>;
};

type ErrorResponse = {
  code?: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
  error?: {
    code?: string;
    details?: Array<{
      field?: string;
      message: string;
    }>;
    message?: string;
  };
  message?: string;
};

type JwtPayload = {
  exp?: number;
};

export class ApiRequestError extends Error {
  public readonly code?: string;
  public readonly details: string[];
  public readonly statusCode: number;

  public constructor(message: string, statusCode: number, code?: string, details: string[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

let refreshSessionPromise: Promise<AuthSession> | null = null;
let hasShownSessionExpiredFeedback = false;

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
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

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = window.atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "="));
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(session: AuthSession): boolean {
  const payload = decodeJwtPayload(session.accessToken);

  if (!payload?.exp) {
    return false;
  }

  const expiresAt = payload.exp * 1000;
  const refreshWindowMs = 60_000;

  return expiresAt - Date.now() <= refreshWindowMs;
}

function notifySessionExpired(): void {
  if (hasShownSessionExpiredFeedback) {
    return;
  }

  hasShownSessionExpiredFeedback = true;
  useFeedbackStore.getState().showFeedback({
    type: "error",
    title: "Sessão expirada",
    description: "Não foi possível renovar seu acesso automaticamente. Faça login novamente."
  });
}

async function refreshSession(currentSession: AuthSession): Promise<AuthSession> {
  const response = await fetch(buildUrl(apiRoutes.auth.refresh), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      refreshToken: currentSession.refreshToken
    })
  });

  if (!response.ok) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  return (await response.json()) as AuthSession;
}

async function getValidSession(session: AuthSession): Promise<AuthSession> {
  if (!shouldRefreshAccessToken(session)) {
    return session;
  }

  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshSession(session)
      .then((refreshedSession) => {
        useAppStore.getState().updateSession(refreshedSession);
        hasShownSessionExpiredFeedback = false;
        return refreshedSession;
      })
      .catch((error: unknown) => {
        useAppStore.getState().logout();
        notifySessionExpired();
        throw error instanceof Error ? error : new Error("Sua sessão expirou. Faça login novamente.");
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }

  return refreshSessionPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const state = useAppStore.getState();
  let session = state.session;
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    if (!session) {
      throw new Error("Sessão ausente. Faça login novamente.");
    }

    session = await getValidSession(session);
    headers.set("Authorization", `Bearer ${session.accessToken}`);
    headers.set("x-clinic-id", session.clinicId);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 401 && options.auth && options.retry !== false && session) {
    try {
      if (!refreshSessionPromise) {
        refreshSessionPromise = refreshSession(session)
          .then((refreshedSession) => {
            useAppStore.getState().updateSession(refreshedSession);
            hasShownSessionExpiredFeedback = false;
            return refreshedSession;
          })
          .finally(() => {
            refreshSessionPromise = null;
          });
      }

      await refreshSessionPromise;

      return apiRequest<T>(path, {
        ...options,
        retry: false
      });
    } catch {
      useAppStore.getState().logout();
      notifySessionExpired();
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
    const error = payload?.error ?? payload;
    const details = (error?.details ?? [])
      .map((detail) => (detail.field ? `${detail.field}: ${detail.message}` : detail.message))
      .filter(Boolean);
    const message = [error?.message ?? "Falha ao se comunicar com o backend.", ...details].join(" ");

    throw new ApiRequestError(message, response.status, error?.code, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { resolveApiBaseUrl };
