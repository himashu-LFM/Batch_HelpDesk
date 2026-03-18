"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("./config");
const logger_1 = require("./logger");
let transporter = null;
function getTransporter() {
    if (config_1.config.email.provider === "mock") {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: config_1.config.email.smtpHost,
            port: config_1.config.email.smtpPort,
            secure: config_1.config.email.smtpPort === 465,
            auth: {
                user: config_1.config.email.smtpUser,
                pass: config_1.config.email.smtpPass
            }
        });
    }
    return transporter;
}
async function sendEmail(params) {
    if (config_1.config.dryRun) {
        (0, logger_1.log)("info", "DRY_RUN: email skipped", { to: params.to, subject: params.subject });
        return { success: true };
    }
    if (config_1.config.email.provider === "mock") {
        (0, logger_1.log)("info", "Mock email sent", { to: params.to, subject: params.subject });
        return { success: true };
    }
    const t = getTransporter();
    if (!t) {
        (0, logger_1.log)("error", "SMTP transporter not configured");
        return { success: false };
    }
    try {
        const info = await t.sendMail({
            from: config_1.config.email.from,
            to: params.to,
            subject: params.subject,
            text: params.body
        });
        (0, logger_1.log)("info", "Email sent", { to: params.to, messageId: info.messageId });
        return { success: true, providerMessageId: info.messageId };
    }
    catch (err) {
        (0, logger_1.log)("error", "Failed to send email", { error: String(err), to: params.to });
        return { success: false };
    }
}
