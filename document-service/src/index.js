// external dependencies
import express from "express";
import mongoose from "mongoose";

// internal dependencies
import { config } from "./config.js";
import routes from "./routes/documentRoute.js";
import { logger } from "./logger.js";
import { requestId, httpLogger } from "./middlewares/requestLogging.js";

const app = express();

app.use(express.json());
app.use(requestId);
app.use(httpLogger);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
let ready = false;
app.get("/ready", (_req, res) => res.status(ready ? 200 : 503).json({ ready }));

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
