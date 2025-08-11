// external dependencies
import express from "express";
import mongoose from "mongoose";

// internal dependencies
import authRoutes from "./routes/authRoutes.js";
import internalRoute from "./routes/internalRoute.js";
import { config } from "./config.js";
import { logger, component } from "./logger.js";
import { requestId, httpLogger } from "./middlewares/requestLogging.js";

const app = express();
const boot = component("boot");
const db = component("db");

app.use(express.json());
app.use(requestId);
app.use(httpLogger);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
let ready = false;
app.get("/ready", (_req, res) => res.status(ready ? 200 : 503).json({ ready }));
app.use("/internal", internalRoute);
app.use("/api/auth", authRoutes);

const PORT = config.port || 5000;

const connectWithRetry = async () => {
  try {
    boot.info("Attempting MongoDB connection for Auth Service...");
    await mongoose.connect(config.mongoUri, {
      dbName: "authdb"
    });
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
