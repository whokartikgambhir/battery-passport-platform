// external dependencies
import morgan from "morgan";
import { randomUUID } from "crypto";

// internal dependencies
import { logger } from "../logger.js";

/**
 * Middleware to attach a unique request id to each incoming request
 * 
 * @param req object containing request data, updated with id
 * @param _res response object (not used)
 * @param next callback to pass control to the next middleware
 * @returns void
 */
export function requestId(req, _res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  next();
}

/**
 * Middleware to log HTTP requests
 * Uses morgan for structured logging and includes request id, method, url, status, length, response time, remote address and user agent
 * 
 * @param tokens morgan tokens object
 * @param req request object with attached id
 * @param res response object
 * @returns null after logging request details
 */
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
