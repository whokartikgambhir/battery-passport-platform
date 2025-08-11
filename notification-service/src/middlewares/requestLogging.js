import morgan from "morgan";
import { randomUUID } from "crypto";
import { logger } from "../logger.js";

export function requestId(req, _res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  next();
}

export const httpLogger = morgan((tokens, req, res) => {
  const line = {
    reqId: req.id,
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    contentLength: tokens.res(req, res, "content-length"),
    responseTimeMs: Number(tokens["response-time"](req, res)),
    remoteAddr: tokens["remote-addr"](req, res),
    userAgent: tokens["user-agent"](req, res)
  };
  logger.info("http", line);
  return null; // prevent morgan from printing by itself
});
