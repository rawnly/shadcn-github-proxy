import { redis } from "bun";
import { rateLimiter, type Store } from "hono-rate-limiter";
import { RedisStore } from "rate-limit-redis";

const store = new RedisStore({
  sendCommand: (command, ...args) => redis.send(command, args ?? []),
  prefix: "gh-reatelimit:",
}) as unknown as Store;

const limiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  store: process.env.REDIS_URL ? store : undefined, // use in-memory store if REDIS_URL is not set
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "",
});

export default limiter;
