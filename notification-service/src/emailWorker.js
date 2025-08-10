import { Worker } from "bullmq";
import { sendEmail } from "./utils/mailer.js";
import mongoose from "mongoose";
import EmailLog from "./models/emailLog.js";
import "dotenv/config";

mongoose.connect(process.env.MONGO_URI || "mongodb://mongo:27017/notificationdb")
  .then(() => console.log("Notification DB connected"))
  .catch(err => console.error("DB connection error:", err));

export const emailWorker = new Worker(
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
    connection: { url: process.env.REDIS_URL || "redis://localhost:6379" },
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }
  }
);
