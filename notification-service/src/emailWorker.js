import { Worker } from "bullmq";
import mongoose from "mongoose";
import { config } from "./config.js";
import { sendEmail } from "./utils/mailer.js";
import EmailLog from "./models/emailLog.js";        // your existing log model
import { AuthUser } from "./models/user.js";        // 🔴 NEW
import "dotenv/config";

// connect local notification DB for logs
mongoose.connect(config.mongoUri)
  .then(() => console.log("[email-worker] Notification DB connected"))
  .catch(err => console.error("[email-worker] DB error:", err.message));

const INVALID = new Set(["you@example.com", "test@example.com", "example@example.com"]);

async function getRecipients(jobData) {
  // If producer passed explicit IDs/emails, prefer them
  if (Array.isArray(jobData.userIds) && jobData.userIds.length) {
    const users = await AuthUser.find({ _id: { $in: jobData.userIds } }, { email: 1 }).lean();
    return users.map(u => u.email);
  }
  if (Array.isArray(jobData.emails) && jobData.emails.length) {
    return jobData.emails;
  }

  // 🔸 Default: email all admins from Auth DB
  const admins = await AuthUser.find({ role: "admin" }, { email: 1 }).lean();
  return admins.map(a => a.email);
}

export const emailWorker = new Worker(
  "emailQueue",
  async job => {
    const { type, passportId } = job.data;

    const recipients = (await getRecipients(job.data))
      .filter(Boolean)
      .map(String)
      .filter(e => !INVALID.has(e.toLowerCase()));

    if (!recipients.length) {
      console.warn("[email-worker] No valid recipients found; skipping");
      return;
    }

    for (const to of recipients) {
      try {
        await sendEmail({ to, type, passportId });
        await EmailLog.create({
          email: to,
          type,
          status: "sent",
          meta: { passportId }
        });
        console.log(`[email-worker] Email sent to ${to}`);
      } catch (err) {
        await EmailLog.create({
          email: to,
          type,
          status: "failed",
          error: err.message,
          meta: { passportId }
        });
        console.error(`[email-worker] Failed for ${to}:`, err.message);
        // don't throw; continue other recipients
      }
    }
  },
  {
    connection: { url: config.redisUrl },
    // retry config applies per job (not per recipient)
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }
  }
);
