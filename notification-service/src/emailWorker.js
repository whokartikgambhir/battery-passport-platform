// external dependencies
import "dotenv/config";
import { Worker } from "bullmq";
import mongoose from "mongoose";

// internal dependencies
import { config } from "./config.js";
import { sendEmail } from "./utils/mailer.js";
import EmailLog from "./models/emailLog.js";
import { AuthUser } from "./models/user.js";
import { component, logger } from "./logger.js";

const wlog = component("worker");

// connect local notification DB for logs
mongoose.connect(config.mongoUri)
  .then(() => wlog.info("Notification DB connected"))
  .catch(err => wlog.error(err, { step: "db-connect" }));

const INVALID = new Set(["you@example.com", "test@example.com", "example@example.com"]);

/**
 * Helper method to resolve recipients for an email job
 * 
 * @param jobData object containing userIds or emails
 * @returns array of recipient email addresses
 */
async function getRecipients(jobData) {
  // If producer passed explicit IDs/emails, prefer them
  if (Array.isArray(jobData.userIds) && jobData.userIds.length) {
    const users = await AuthUser.find({ _id: { $in: jobData.userIds } }, { email: 1 }).lean();
    return users.map(u => u.email);
  }
  if (Array.isArray(jobData.emails) && jobData.emails.length) {
    return jobData.emails;
  }

  // Default: email all admins from Auth DB
  const admins = await AuthUser.find({ role: "admin" }, { email: 1 }).lean();
  return admins.map(a => a.email);
}

/**
 * Worker to process email jobs from BullMQ queue
 * Retries failed jobs with exponential backoff
 * 
 * @param job BullMQ job object containing type, passportId, recipients
 * @returns void, sends emails and logs results to DB
 */
export const emailWorker = new Worker(
  "emailQueue",
  async job => {
    const { type, passportId } = job.data;

    const recipients = (await getRecipients(job.data))
      .filter(Boolean)
      .map(String)
      .filter(e => !INVALID.has(e.toLowerCase()));

    if (!recipients.length) {
      wlog.warn("no valid recipients", { jobId: job.id });
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
        wlog.info("email sent", { to, type, passportId });
      } catch (err) {
        await EmailLog.create({
          email: to,
          type,
          status: "failed",
          error: err.message,
          meta: { passportId }
        });
        wlog.error(err, { to, type, passportId });
        // continue other recipients
      }
    }
  },
  {
    connection: { url: config.redisUrl },
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }
  }
);
