import { createLogger, format, transports } from "winston";

const { combine, timestamp, errors, splat, json, printf, colorize } = format;

const isProd = process.env.NODE_ENV === "production";
const svc = process.env.SERVICE_NAME || "auth";
const logLevel = process.env.LOG_LEVEL || "info";

const pretty = printf(({ level, message, timestamp, stack, ...meta }) => {
  const base = `${timestamp} [${svc}] ${level}: ${message}`;
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return stack ? `${base}\n${stack}${rest}` : `${base}${rest}`;
});

export const logger = createLogger({
  level: logLevel,
  defaultMeta: { service: svc },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    isProd ? json() : combine(colorize(), pretty)
  ),
  transports: [new transports.Console()]
});

export const component = (name) => ({
  debug: (msg, meta) => logger.debug(msg, { component: name, ...meta }),
  info:  (msg, meta) => logger.info(msg,  { component: name, ...meta }),
  warn:  (msg, meta) => logger.warn(msg,  { component: name, ...meta }),
  error: (err, meta) => {
    if (err instanceof Error) return logger.error(err.message, { component: name, stack: err.stack, ...meta });
    return logger.error(err, { component: name, ...meta });
  }
});
