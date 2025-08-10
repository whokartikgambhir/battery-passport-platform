import nodemailer from "nodemailer";
import { config } from "../config.js";

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.mailSmtpUser,
    pass: config.mailSmtpPass
  }
});

// subject/body templates
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
