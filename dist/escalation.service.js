"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEscalationBatch = runEscalationBatch;
const prisma_1 = require("./prisma");
const config_1 = require("./config");
const email_service_1 = require("./email.service");
const logger_1 = require("./logger");
async function findRecipientForCaseType(caseType) {
    const roleCode = caseType === "INTERNAL" ? "SENIOR_MANAGER_OPERATIONS" : "MEDICAL_ADMINISTRATOR";
    const userRole = await prisma_1.prisma.userRole.findFirst({
        where: {
            role: { code: roleCode },
            user: { isActive: true }
        },
        include: { user: true },
        orderBy: { createdAt: "asc" }
    });
    if (!userRole?.user)
        return null;
    return { userId: userRole.user.id, email: userRole.user.email };
}
async function runEscalationBatch() {
    const now = new Date();
    const facilitiesThreshold = new Date(now.getTime() - config_1.config.facilitiesEscalationHours * 60 * 60 * 1000);
    const careThreshold = new Date(now.getTime() - config_1.config.careEscalationHours * 60 * 60 * 1000);
    const [internalCases, patientCases] = await Promise.all([
        prisma_1.prisma.case.findMany({
            where: {
                caseType: "INTERNAL",
                status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
                escalatedAt: null,
                createdAt: { lte: facilitiesThreshold }
            },
            take: 500
        }),
        prisma_1.prisma.case.findMany({
            where: {
                caseType: "PATIENT",
                status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
                escalatedAt: null,
                createdAt: { lte: careThreshold }
            },
            take: 500
        })
    ]);
    const toProcess = [...internalCases, ...patientCases];
    let escalatedCount = 0;
    let emailsSent = 0;
    let errors = 0;
    for (const c of toProcess) {
        try {
            if (c.status === "ESCALATED" || c.escalatedAt) {
                continue;
            }
            const recipient = await findRecipientForCaseType(c.caseType);
            if (!recipient) {
                (0, logger_1.log)("error", "No escalation recipient found", {
                    caseId: c.id,
                    caseType: c.caseType
                });
                continue;
            }
            await prisma_1.prisma.$transaction(async (tx) => {
                const updated = await tx.case.update({
                    where: { id: c.id },
                    data: {
                        status: "ESCALATED",
                        escalatedAt: now
                    }
                });
                await tx.caseEvent.create({
                    data: {
                        caseId: updated.id,
                        eventType: "AUTO_ESCALATED",
                        eventLabel: "Case auto-escalated due to SLA breach",
                        metadataJson: JSON.stringify({
                            previousStatus: c.status,
                            escalatedAt: now.toISOString()
                        })
                    }
                });
                const emailSubject = `[${updated.caseNumber}] Case escalated`;
                const emailBody = [
                    `Case Number: ${updated.caseNumber}`,
                    `Type: ${updated.caseType}`,
                    `Subject: ${updated.subject}`,
                    `Description: ${updated.description}`,
                    `Created At: ${updated.createdAt.toISOString()}`
                ].join("\n");
                const emailResult = await (0, email_service_1.sendEmail)({
                    to: recipient.email,
                    subject: emailSubject,
                    body: emailBody
                });
                if (emailResult.success) {
                    emailsSent += 1;
                }
                await tx.notificationLog.create({
                    data: {
                        caseId: updated.id,
                        recipientUserId: recipient.userId,
                        channel: "EMAIL",
                        templateKey: "case-escalated-v1",
                        status: emailResult.success ? "SENT" : "FAILED",
                        providerMessageId: emailResult.providerMessageId ?? null,
                        metadataJson: JSON.stringify({
                            reason: "AUTO_ESCALATED",
                            caseNumber: updated.caseNumber
                        }),
                        // NOTE: base schema doesn't have these; if you later add them,
                        // uncomment next two fields:
                        // emailSentTo: recipient.email,
                        // emailSentAt: emailResult.success ? now : null,
                    }
                });
            });
            escalatedCount += 1;
            (0, logger_1.log)("info", "Escalated Case", { caseId: c.id, caseNumber: c.caseNumber, type: c.caseType });
            (0, logger_1.log)("info", "Email sent to", { caseId: c.id, to: recipient.email });
        }
        catch (err) {
            errors += 1;
            (0, logger_1.log)("error", "Error processing escalation for case", {
                caseId: c.id,
                error: String(err)
            });
        }
    }
    return { escalatedCount, emailsSent, errors };
}
