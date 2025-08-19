// external dependencies
import morgan from "morgan";
import { randomUUID } from "crypto";

// internal dependencies
import { logger } from "../logger.js";

/**
 * Middleware to attach a unique request id to each request
 * 
 * @param req request object updated with id
 * @param _res response object (unused)
 * @param next callback to continue to next middleware
 * @returns void
 */
export function requestId(req, _res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  next();
}

/**
 * Middleware to log HTTP requests
 * Logs method, url, status, content length, response time, remote address, and user agent
 * 
 * @param tokens morgan tokens object
 * @param req request object with id
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
  return null;
});
