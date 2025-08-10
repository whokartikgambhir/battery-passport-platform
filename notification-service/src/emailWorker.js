import { Worker } from "bullmq";
import mongoose from "mongoose";
import "dotenv/config";
import { config } from "./config.js";
import { sendEmail } from "./utils/mailer.js";
import EmailLog from "./models/emailLog.js";

mongoose.connect(config.mongoUri)
  .then(() => console.log("Notification DB connected"))
  .catch(err => console.error("DB connection error:", err));

const worker = new Worker(
  "emailQueue",
  async job => {
    const { to, type, passportId } = job.data;

    try {
      await sendEmail({ to, type, passportId });
      await EmailLog.create({
        email: to,
        type,
        status: "sent",
        meta: { passportId }
      });
      console.log(`[Worker] Email sent to ${to}`);
    } catch (err) {
      await EmailLog.create({
        email: to,
        type,
        status: "failed",
        error: err.message,
        meta: { passportId }
      });
      console.error(`[Worker] Failed to send email to ${to}`, err.message);
      throw err;
    }
  },
  {
    connection: { url: config.redisUrl },
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }
  }
);

worker.on("failed", (job, err) =>
  console.error("[email-worker] job failed", job?.id, err)
);
worker.on("completed", job =>
  console.log("[email-worker] job completed", job.id)
);
