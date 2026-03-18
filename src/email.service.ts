import nodemailer from "nodemailer";
import { config } from "./config";
import { log } from "./logger";

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface EmailResult {
  success: boolean;
  providerMessageId?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (config.email.provider === "mock") {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpPort === 465,
      auth: {
        user: config.email.smtpUser,
        pass: config.email.smtpPass
      }
    });
  }
  return transporter;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  if (config.dryRun) {
    log("info", "DRY_RUN: email skipped", { to: params.to, subject: params.subject });
    return { success: true };
  }

  if (config.email.provider === "mock") {
    log("info", "Mock email sent", { to: params.to, subject: params.subject });
    return { success: true };
  }

  const t = getTransporter();
  if (!t) {
    log("error", "SMTP transporter not configured");
    return { success: false };
  }

  try {
    const info = await t.sendMail({
      from: config.email.from,
      to: params.to,
      subject: params.subject,
      text: params.body
    });
    log("info", "Email sent", { to: params.to, messageId: info.messageId });
    return { success: true, providerMessageId: info.messageId };
  } catch (err) {
    log("error", "Failed to send email", { error: String(err), to: params.to });
    return { success: false };
  }
}