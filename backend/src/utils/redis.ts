import { createClient, type RedisClientType } from "redis";

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  return value === "true";
};

const parseInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const readRedisConfig = () => ({
  enabled: parseBoolean(process.env.REDIS_ENABLED, false),
  url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  keyPrefix: process.env.REDIS_KEY_PREFIX ?? "hubly",
  connectTimeoutMs: parseInteger(process.env.REDIS_CONNECT_TIMEOUT_MS, 10_000),
});

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  const config = readRedisConfig();

  if (!config.enabled) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (connectPromise) {
    return connectPromise;
  }

  client = createClient({
    url: config.url,
    socket: {
      connectTimeout: config.connectTimeoutMs,
    },
  });

  connectPromise = client.connect().then(() => client as RedisClientType).finally(() => {
    connectPromise = null;
  });

  return connectPromise;
};

export const closeRedisClient = async (): Promise<void> => {
  if (!client) {
    return;
  }

  if (client.isOpen) {
    await client.quit();
  }

  client = null;
  connectPromise = null;
};
