import pino from "pino";

/**
 * Sensitive fields to redact from logs to avoid leaking PII/secrets.
 */
const redactFields = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "sessionToken",
  "secret",
  "key",
  "*.password",
  "*.token",
  "*.secret",
];

const isDev = process.env.NODE_ENV !== "production";

/**
 * Structured logger for DaStack.
 *
 * Provides fast, JSON-based structured logging with Pino.
 * - In Development: Uses `pino-pretty` for colorful, highly readable console output.
 * - In Production: Outputs raw JSON with proper redaction for sensitive fields.
 *
 * Features:
 * - Redacts passwords, tokens, and authorization headers automatically.
 * - Serializes standard error objects to provide stack traces.
 * - Prepends module names dynamically in development logs.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: redactFields,
    censor: "**REDACTED**",
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  transport: isDev
    ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname,env,service,module",
        messageFormat: "[\x1b[36m{module}\x1b[0m] {msg}", // Cyan-colored module tags in dev view
      },
    }
    : undefined,
  base: {
    service: "dastack",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger scoped to a specific module.
 *
 * @param module - Logical module name (e.g. `"billing"`, `"auth"`, `"database"`)
 * @example
 * ```ts
 * import { createLogger } from "@/lib/logger";
 * const log = createLogger("auth");
 * log.info({ userId }, "User signed in");
 * ```
 */
export function createLogger(module: string) {
  return logger.child({ module });
}

export default logger;
