import { runEscalationBatch } from "./escalation.service";
import { log } from "./logger";

export const handler = async () => {
  log("info", "Escalation batch started");

  const summary = await runEscalationBatch();

  log("info", "Escalation batch finished", { ...summary });

  return {
    statusCode: 200,
    body: JSON.stringify(summary)
  };
};

// Local test
if (require.main === module) {
  handler()
    .then((res) => {
      console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}