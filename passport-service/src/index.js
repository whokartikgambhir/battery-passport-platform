// external dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// internal dependencies
import { config } from "./config.js";
import passportRoutes from "./routes/passportRoute.js";
import internalRoute from "./routes/internalRoute.js";
import { logger } from "./logger.js";
import { requestId, httpLogger } from "./middlewares/requestLogging.js";
import { mountSwagger } from "./swagger.js";

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

// Swagger (before limiters)
mountSwagger(app, "Battery Passport Service");

// global rate limiter (protect read/list operations)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // a bit higher here
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(express.json());
app.use(requestId);
app.use(httpLogger);

// health/ready (uniform)
app.get("/health", (_req, res) => res.json({ status: "ok" }));
let ready = false;
app.get("/ready", (_req, res) => res.status(ready ? 200 : 503).json({ ready }));

// routes
app.use("/internal", internalRoute);
app.use("/api/passports", passportRoutes);

const connectWithRetry = async () => {
  try {
    logger.info("Attempting MongoDB connection for Passport Service...");
    await mongoose.connect(config.mongoUri, { dbName: "passportdb" });
    logger.info("Passport DB connected");
    app.listen(config.port, () => logger.info(`Passport Service running on port ${config.port}`));
    ready = true;
  } catch (err) {
    logger.error("DB connection failed, retrying in 5s...", { error: err.message });
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
