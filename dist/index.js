"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const escalation_service_1 = require("./escalation.service");
const logger_1 = require("./logger");
const handler = async () => {
    (0, logger_1.log)("info", "Escalation batch started");
    const summary = await (0, escalation_service_1.runEscalationBatch)();
    (0, logger_1.log)("info", "Escalation batch finished", { ...summary });
    return {
        statusCode: 200,
        body: JSON.stringify(summary)
    };
};
exports.handler = handler;
// Local test
if (require.main === module) {
    (0, exports.handler)()
        .then((res) => {
        console.log(res);
        process.exit(0);
    })
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
