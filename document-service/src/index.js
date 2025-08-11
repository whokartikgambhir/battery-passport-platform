// external dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// internal dependencies
import { config } from "./config.js";
import routes from "./routes/documentRoute.js";
import { logger } from "./logger.js";
import { requestId, httpLogger } from "./middlewares/requestLogging.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// security headers
app.use(helmet());

// CORS
const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowed,
    credentials: false,
  })
);

// global rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(express.json());
app.use(requestId);
app.use(httpLogger);

// health/ready
app.get("/health", (_req, res) => res.json({ status: "ok" }));
let ready = false;
app.get("/ready", (_req, res) => res.status(ready ? 200 : 503).json({ ready }));

// API routes
app.use("/api/documents", routes);

const connectWithRetry = async () => {
  try {
    logger.info("Attempting MongoDB connection...");
    await mongoose.connect(config.mongoUri, { dbName: "documentdb" });
    logger.info("Document DB connected");
    app.listen(config.port, () => logger.info(`Document Service running on ${config.port}`));
    ready = true;
  } catch (err) {
    logger.error("Mongo connection failed, retrying in 5s...", { error: err.message });
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// centralized error handler
app.use((err, _req, res, _next) => {
  logger.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
