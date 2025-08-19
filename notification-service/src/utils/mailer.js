// external dependencies
import nodemailer from "nodemailer";

// internal dependencies
import { config } from "../config.js";

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.mailSmtpUser,
    pass: config.mailSmtpPass
  }
});

/**
 * Method to build email subject and body based on event type
 * 
 * @param param0 object containing type (created, updated, deleted) and passportId
 * @returns object with subject and text
 */
export function buildMessage({ type, passportId }) {
  const verb =
    type === "created" ? "Created" :
    type === "updated" ? "Updated" :
    type === "deleted" ? "Deleted" : "Event";

  const subject = `✅ Passport ${verb}: ${passportId}`;
  const text =
    type === "deleted"
      ? `Passport ${passportId} has been deleted.`
      : `A passport ${passportId} has been ${verb.toLowerCase()} successfully.`;

  return { subject, text };
}

/**
 * Method to send email notification using nodemailer
 * 
 * @param param0 object containing recipient (to), type, and passportId
 * @returns promise of nodemailer sendMail result
 */
export async function sendEmail({ to, type, passportId }) {
  const { subject, text } = buildMessage({ type, passportId });

  const from = `Battery Passport <${config.mailFromUser}>`;

  return transport.sendMail({
    from,
    to,
    subject,
    text
  });
}
