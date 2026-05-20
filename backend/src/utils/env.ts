import "dotenv/config";

type Env = {
  HTTP_HOST: string;
  HTTP_PORT: number;
  CORS_ALLOWED_ORIGINS: string[];
  DB_TYPE: "mysql" | "sqljs";
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_LOGGING: boolean;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  SYSTEM_ADMIN_JWT_SECRET: string;
  SYSTEM_ADMIN_EMAIL: string;
  SYSTEM_ADMIN_PASSWORD_HASH: string;
  SYSTEM_ADMIN_ACCESS_EXPIRES_IN: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  LOGIN_RATE_LIMIT_WINDOW_MS: number;
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: number;
  LOGIN_BRUTE_FORCE_THRESHOLD: number;
  LOGIN_BRUTE_FORCE_BLOCK_MS: number;
  PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS: number;
  PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS: number;
  CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS: number;
  CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS: number;
  WHATSAPP_EVOLUTION_ENABLED: boolean;
  WHATSAPP_EVOLUTION_BASE_URL: string;
  WHATSAPP_EVOLUTION_AUTH_HEADER_NAME: string;
  WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE: string;
  WHATSAPP_EVOLUTION_INSTANCE: string;
  WHATSAPP_EVOLUTION_TIMEOUT_MS: number;
  REDIS_ENABLED: boolean;
  REDIS_URL: string;
  REDIS_KEY_PREFIX: string;
  REDIS_CONNECT_TIMEOUT_MS: number;
  PUBLIC_API_BASE_URL: string;
  PUBLIC_WEB_APP_URL: string;
  STRIPE_BILLING_MODE: "test" | "live";
  STRIPE_TEST_SECRET_KEY: string;
  STRIPE_LIVE_SECRET_KEY: string;
  STRIPE_TEST_WEBHOOK_SECRET: string;
  STRIPE_LIVE_WEBHOOK_SECRET: string;
  STRIPE_TEST_PUBLISHABLE_KEY: string;
  STRIPE_LIVE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_CONNECT_RETURN_URL: string;
  STRIPE_CONNECT_REFRESH_URL: string;
};

const parsePort = (value: string | undefined): number => {
  const fallback = 3333;

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  return value === "true";
};

const parseStringList = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) {
    return fallback;
  }

  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : fallback;
};

const parseStripeBillingMode = (value: string | undefined): Env["STRIPE_BILLING_MODE"] =>
  value === "live" ? "live" : "test";

const stripeBillingMode = parseStripeBillingMode(process.env.STRIPE_BILLING_MODE);
const activeStripeSecretKey = stripeBillingMode === "live"
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY;
const activeStripeWebhookSecret = stripeBillingMode === "live"
  ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
  : process.env.STRIPE_TEST_WEBHOOK_SECRET;
const activeStripePublishableKey = stripeBillingMode === "live"
  ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY
  : process.env.STRIPE_TEST_PUBLISHABLE_KEY;

export const env: Env = {
  HTTP_HOST: process.env.HTTP_HOST ?? "0.0.0.0",
  HTTP_PORT: parsePort(process.env.HTTP_PORT),
  CORS_ALLOWED_ORIGINS: parseStringList(process.env.CORS_ALLOWED_ORIGINS, ["http://localhost:3000"]),
  DB_TYPE: process.env.DB_TYPE === "sqljs" ? "sqljs" : "mysql",
  DB_HOST: process.env.DB_HOST ?? "127.0.0.1",
  DB_PORT: parsePort(process.env.DB_PORT ?? "3306"),
  DB_NAME: process.env.DB_NAME ?? "hubly",
  DB_USERNAME: process.env.DB_USERNAME ?? "root",
  DB_PASSWORD: process.env.DB_PASSWORD ?? "",
  DB_LOGGING: parseBoolean(process.env.DB_LOGGING, false),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "change-access-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "change-refresh-secret",
  SYSTEM_ADMIN_JWT_SECRET: process.env.SYSTEM_ADMIN_JWT_SECRET ?? "change-system-admin-secret",
  SYSTEM_ADMIN_EMAIL: process.env.SYSTEM_ADMIN_EMAIL ?? "owner@hubly.local",
  SYSTEM_ADMIN_PASSWORD_HASH: process.env.SYSTEM_ADMIN_PASSWORD_HASH ?? "",
  SYSTEM_ADMIN_ACCESS_EXPIRES_IN: process.env.SYSTEM_ADMIN_ACCESS_EXPIRES_IN ?? "10m",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  LOGIN_RATE_LIMIT_WINDOW_MS: parsePort(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "60000"),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: parsePort(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? "5"),
  LOGIN_BRUTE_FORCE_THRESHOLD: parsePort(process.env.LOGIN_BRUTE_FORCE_THRESHOLD ?? "8"),
  LOGIN_BRUTE_FORCE_BLOCK_MS: parsePort(process.env.LOGIN_BRUTE_FORCE_BLOCK_MS ?? "900000"),
  PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS: parsePort(process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS ?? "60000"),
  PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS: parsePort(process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS ?? "3"),
  CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS: parsePort(process.env.CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS ?? "60000"),
  CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS: parsePort(process.env.CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS ?? "20"),
  WHATSAPP_EVOLUTION_ENABLED: parseBoolean(process.env.WHATSAPP_EVOLUTION_ENABLED, false),
  WHATSAPP_EVOLUTION_BASE_URL: process.env.WHATSAPP_EVOLUTION_BASE_URL ?? "",
  WHATSAPP_EVOLUTION_AUTH_HEADER_NAME: process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_NAME ?? "apikey",
  WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE:
    process.env.WHATSAPP_EVOLUTION_AUTH_HEADER_VALUE ?? process.env.WHATSAPP_EVOLUTION_API_KEY ?? "",
  WHATSAPP_EVOLUTION_INSTANCE: process.env.WHATSAPP_EVOLUTION_INSTANCE ?? "",
  WHATSAPP_EVOLUTION_TIMEOUT_MS: parsePort(process.env.WHATSAPP_EVOLUTION_TIMEOUT_MS ?? "10000"),
  REDIS_ENABLED: parseBoolean(process.env.REDIS_ENABLED, false),
  REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX ?? "hubly",
  REDIS_CONNECT_TIMEOUT_MS: parsePort(process.env.REDIS_CONNECT_TIMEOUT_MS ?? "10000"),
  PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL ?? "http://localhost:3333",
  PUBLIC_WEB_APP_URL: process.env.PUBLIC_WEB_APP_URL ?? "http://localhost:3000",
  STRIPE_BILLING_MODE: stripeBillingMode,
  STRIPE_TEST_SECRET_KEY: process.env.STRIPE_TEST_SECRET_KEY ?? "",
  STRIPE_LIVE_SECRET_KEY: process.env.STRIPE_LIVE_SECRET_KEY ?? "",
  STRIPE_TEST_WEBHOOK_SECRET: process.env.STRIPE_TEST_WEBHOOK_SECRET ?? "",
  STRIPE_LIVE_WEBHOOK_SECRET: process.env.STRIPE_LIVE_WEBHOOK_SECRET ?? "",
  STRIPE_TEST_PUBLISHABLE_KEY: process.env.STRIPE_TEST_PUBLISHABLE_KEY ?? "",
  STRIPE_LIVE_PUBLISHABLE_KEY: process.env.STRIPE_LIVE_PUBLISHABLE_KEY ?? "",
  STRIPE_SECRET_KEY: activeStripeSecretKey ?? process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: activeStripeWebhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  STRIPE_PUBLISHABLE_KEY: activeStripePublishableKey ?? process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  STRIPE_CONNECT_RETURN_URL: process.env.STRIPE_CONNECT_RETURN_URL ?? `${process.env.PUBLIC_WEB_APP_URL ?? "http://localhost:3000"}/settings?payments=return`,
  STRIPE_CONNECT_REFRESH_URL: process.env.STRIPE_CONNECT_REFRESH_URL ?? `${process.env.PUBLIC_WEB_APP_URL ?? "http://localhost:3000"}/settings?payments=refresh`,
};
