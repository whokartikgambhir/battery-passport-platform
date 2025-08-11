// external dependencies
import express from "express";
import helmet from "helmet";
import cors from "cors";

// internal dependencies
import { config } from "./config.js";
import { startConsumer } from "./consumer.js";
import { requestId, httpLogger } from "./middlewares/requestLogging.js";
import { logger } from "./logger.js";
import { mountSwagger } from "./swagger.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// basic hardening + CORS for consistency
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "*").split(",").map(s => s.trim()) }));

// HTTP logging + request IDs
app.use(requestId);
app.use(httpLogger);

// Swagger
mountSwagger(app, "Notification Service");

// health/ready
app.get("/health", (_req, res) => res.json({ status: "ok" }));
let consumerReady = false;
app.get("/ready", (_req, res) => res.status(consumerReady ? 200 : 503).send(consumerReady ? "ready" : "starting"));

// root
app.get("/", (_req, res) => res.send("Notification Service Running"));

const server = app.listen(config.port, () =>
  logger.info(`Notification Service on ${config.port}`)
);

// retry wrapper for Kafka consumer
const startConsumerWithRetry = async () => {
  const base = 2000;     // 2s
  const max = 15000;     // 15s
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await startConsumer();
      consumerReady = true;
      logger.info("Kafka consumer connected ✅");
      break;
    } catch (err) {
      attempt += 1;
      const delay = Math.min(base * Math.pow(1.5, attempt - 1), max);
      logger.error(`Kafka consumer error (attempt ${attempt}). Retrying in ${Math.round(delay / 1000)}s...`, { error: err.message });
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

startConsumerWithRetry();

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down...`);
  try {
    server && server.close();
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
