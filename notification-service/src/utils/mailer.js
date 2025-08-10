import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendEmail = async ({ to, type, passportId }) => {
  let subject, html;

  if (type === "created") {
    subject = `✅ Passport Created: ${passportId}`;
    html = `<p>A new passport <b>${passportId}</b> has been created successfully.</p>`;
  }

  if (type === "updated") {
    subject = `✏️ Passport Updated: ${passportId}`;
    html = `<p>Passport <b>${passportId}</b> has been updated with new details.</p>`;
  }

  if (type === "deleted") {
    subject = `🗑️ Passport Deleted: ${passportId}`;
    html = `<p>Passport <b>${passportId}</b> has been deleted from the system.</p>`;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html
  });
};
