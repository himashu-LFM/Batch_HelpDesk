"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
exports.config = {
    databaseUrl: process.env.DATABASE_URL ?? "",
    facilitiesEscalationHours: Number(process.env.FACILITIES_ESCALATION_DURATION ?? "4"),
    careEscalationHours: Number(process.env.CARE_ESCALATION_DURATION ?? "2"),
    dryRun: process.env.DRY_RUN === "true",
    email: {
        provider: process.env.EMAIL_PROVIDER ?? "mock", // "mock" or "smtp"
        from: process.env.EMAIL_FROM ?? "no-reply@helpdesk.local",
        smtpHost: process.env.SMTP_HOST ?? "",
        smtpPort: Number(process.env.SMTP_PORT ?? "587"),
        smtpUser: process.env.SMTP_USER ?? "",
        smtpPass: process.env.SMTP_PASS ?? ""
    }
};
if (!exports.config.databaseUrl) {
    throw new Error("DATABASE_URL must be set");
}
