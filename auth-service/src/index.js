// external dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// internal dependencies
import authRoutes from "./routes/authRoutes.js";
import internalRoute from "./routes/internalRoute.js";
import { config } from "./config.js";
import { logger, component } from "./logger.js";
import { requestId, httpLogger } from "./middlewares/requestLogging.js";
import { mountSwagger } from "./swagger.js";

const app = express();
const boot = component("boot");
const db = component("db");

app.disable("x-powered-by");
app.set("trust proxy", 1); // if behind reverse proxy in hosted envs

// security headers
app.use(helmet());

// CORS (allow list via env)
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
mountSwagger(app, "Auth Service");

// global rate limiter (100 req/min/IP)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// tighter limiter for auth endpoints (login/register abuse protection)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // stricter
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(requestId);
app.use(httpLogger);

// health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

let ready = false;
app.get("/ready", (_req, res) => res.status(ready ? 200 : 503).json({ ready }));

// routes
app.use("/internal", internalRoute);
app.use("/api/auth", authLimiter, authRoutes);

const PORT = config.port || 5000;

const connectWithRetry = async () => {
  try {
    boot.info("Attempting MongoDB connection for Auth Service...");
    await mongoose.connect(config.mongoUri, { dbName: "authdb" });
    db.info("MongoDB connected");
    app.listen(PORT, () => logger.info(`Auth Service running on port ${PORT}`));
    ready = true;
  } catch (err) {
    db.error(err, { msg: "Mongo connection failed, retrying in 5s..." });
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// central error handler
app.use((err, _req, res, _next) => {
  logger.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app; // (useful later for tests)
