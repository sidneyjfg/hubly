import { AppError } from "../utils/app-error";
import { getRedisClient, readRedisConfig } from "../utils/redis";

type CounterState = {
  count: number;
  resetAt: number;
};

type BlockState = {
  blockedUntil: number;
};

class RequestProtectionStore {
  private readonly counters = new Map<string, CounterState>();
  private readonly blocks = new Map<string, BlockState>();

  public assertNotBlocked(key: string, message: string): void {
    const block = this.blocks.get(key);
    if (!block) {
      return;
    }

    if (block.blockedUntil <= Date.now()) {
      this.blocks.delete(key);
      return;
    }

    throw new AppError("security.temporarily_blocked", message, 429);
  }

  public hitRateLimit(key: string, limit: number, windowMs: number, message: string): void {
    const now = Date.now();
    const currentState = this.counters.get(key);

    if (!currentState || currentState.resetAt <= now) {
      this.counters.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return;
    }

    currentState.count += 1;
    if (currentState.count > limit) {
      throw new AppError("security.rate_limit_exceeded", message, 429);
    }
  }

  public registerFailure(key: string, threshold: number, blockMs: number): void {
    const now = Date.now();
    const currentState = this.counters.get(key);

    if (!currentState || currentState.resetAt <= now) {
      this.counters.set(key, {
        count: 1,
        resetAt: now + blockMs,
      });
      return;
    }

    currentState.count += 1;

    if (currentState.count >= threshold) {
      this.blocks.set(key, {
        blockedUntil: now + blockMs,
      });
      this.counters.delete(key);
    }
  }

  public clearFailures(key: string): void {
    this.counters.delete(key);
    this.blocks.delete(key);
  }

  public reset(): void {
    this.counters.clear();
    this.blocks.clear();
  }
}

const localFallbackStore = new RequestProtectionStore();

const buildRedisKey = (key: string): string => {
  const config = readRedisConfig();
  return `${config.keyPrefix}:security:${key}`;
};

const assertNotBlocked = async (key: string, message: string): Promise<void> => {
  const redis = await getRedisClient();

  if (!redis) {
    localFallbackStore.assertNotBlocked(key, message);
    return;
  }

  const blockedUntil = await redis.get(buildRedisKey(`block:${key}`));
  if (!blockedUntil) {
    return;
  }

  if (Number(blockedUntil) <= Date.now()) {
    await redis.del(buildRedisKey(`block:${key}`));
    return;
  }

  throw new AppError("security.temporarily_blocked", message, 429);
};

const hitRateLimit = async (key: string, limit: number, windowMs: number, message: string): Promise<void> => {
  const redis = await getRedisClient();

  if (!redis) {
    localFallbackStore.hitRateLimit(key, limit, windowMs, message);
    return;
  }

  const redisKey = buildRedisKey(`counter:${key}`);
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.pExpire(redisKey, windowMs);
  }

  if (count > limit) {
    throw new AppError("security.rate_limit_exceeded", message, 429);
  }
};

const registerFailure = async (key: string, threshold: number, blockMs: number): Promise<void> => {
  const redis = await getRedisClient();

  if (!redis) {
    localFallbackStore.registerFailure(key, threshold, blockMs);
    return;
  }

  const failureKey = buildRedisKey(`failure:${key}`);
  const count = await redis.incr(failureKey);

  if (count === 1) {
    await redis.pExpire(failureKey, blockMs);
  }

  if (count >= threshold) {
    await redis.set(buildRedisKey(`block:${key}`), String(Date.now() + blockMs), {
      PX: blockMs,
    });
    await redis.del(failureKey);
  }
};

const clearFailures = async (key: string): Promise<void> => {
  const redis = await getRedisClient();

  if (!redis) {
    localFallbackStore.clearFailures(key);
    return;
  }

  await redis.del(buildRedisKey(`failure:${key}`));
  await redis.del(buildRedisKey(`block:${key}`));
};

const readInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export type LoginProtectionConfig = {
  windowMs: number;
  rateLimitMaxAttempts: number;
  bruteForceThreshold: number;
  bruteForceBlockMs: number;
};

export type ForgotPasswordProtectionConfig = {
  windowMs: number;
  maxAttempts: number;
};

export type CriticalRouteProtectionConfig = {
  windowMs: number;
  maxAttempts: number;
};

export const readLoginProtectionConfig = (): LoginProtectionConfig => ({
  windowMs: readInteger(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxAttempts: readInteger(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 5),
  bruteForceThreshold: readInteger(process.env.LOGIN_BRUTE_FORCE_THRESHOLD, 8),
  bruteForceBlockMs: readInteger(process.env.LOGIN_BRUTE_FORCE_BLOCK_MS, 15 * 60_000),
});

export const readForgotPasswordProtectionConfig = (): ForgotPasswordProtectionConfig => ({
  windowMs: readInteger(process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS, 60_000),
  maxAttempts: readInteger(process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX_ATTEMPTS, 3),
});

export const readCriticalRouteProtectionConfig = (): CriticalRouteProtectionConfig => ({
  windowMs: readInteger(process.env.CRITICAL_ROUTE_RATE_LIMIT_WINDOW_MS, 60_000),
  maxAttempts: readInteger(process.env.CRITICAL_ROUTE_RATE_LIMIT_MAX_ATTEMPTS, 20),
});

const requestProtectionStore = new RequestProtectionStore();

export const requestProtection = {
  async assertLoginAllowed(ip: string, email: string): Promise<void> {
    const config = readLoginProtectionConfig();
    await assertNotBlocked(`login:ip:${ip}`, "Login temporarily blocked.");
    await assertNotBlocked(`login:email:${email}`, "Login temporarily blocked.");
    await hitRateLimit(
      `login:rate:${ip}`,
      config.rateLimitMaxAttempts,
      config.windowMs,
      "Too many login attempts.",
    );
  },

  async registerLoginFailure(ip: string, email: string): Promise<void> {
    const config = readLoginProtectionConfig();
    await registerFailure(`login:ip:${ip}`, config.bruteForceThreshold, config.bruteForceBlockMs);
    await registerFailure(
      `login:email:${email}`,
      config.bruteForceThreshold,
      config.bruteForceBlockMs,
    );
  },

  async clearLoginFailures(ip: string, email: string): Promise<void> {
    await clearFailures(`login:ip:${ip}`);
    await clearFailures(`login:email:${email}`);
  },

  async enforceForgotPasswordLimit(ip: string, email: string): Promise<void> {
    const config = readForgotPasswordProtectionConfig();
    await hitRateLimit(
      `forgot-password:ip:${ip}`,
      config.maxAttempts,
      config.windowMs,
      "Too many password recovery attempts.",
    );
    await hitRateLimit(
      `forgot-password:email:${email}`,
      config.maxAttempts,
      config.windowMs,
      "Too many password recovery attempts.",
    );
  },

  async enforceCriticalRouteLimit(key: string): Promise<void> {
    const config = readCriticalRouteProtectionConfig();
    await hitRateLimit(
      `critical:${key}`,
      config.maxAttempts,
      config.windowMs,
      "Too many requests to a critical route.",
    );
  },

  async reset(): Promise<void> {
    localFallbackStore.reset();

    const redis = await getRedisClient();
    if (!redis) {
      return;
    }

    const config = readRedisConfig();
    const keys = await redis.keys(`${config.keyPrefix}:security:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },
};
