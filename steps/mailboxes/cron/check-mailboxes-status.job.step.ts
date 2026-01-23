import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { listEmailAccounts } from "../../services/plusvibe/plusvibe";

export const config: CronConfig = {
  type: "cron",
  name: "checkMailboxStatus",
  description:
    "Check the status of the mailboxes and update it based on some conditions",
  cron: "*/15 * * * *",
  emits: [],
  flows: ["GetMailboxes"],
};

const getUpdatedMailboxInfo = async (workspace: string, logger: any) => {
  const accounts = await listEmailAccounts(workspace, logger);
  const results = [];

  for (const account of accounts) {
    const health =
      account.payload.analytics.health_scores["7d_overall_warmup_health"];
    const created_at = account.timestamp_created;
    const email = account.email;

    // Calculate warmup days
    const createdDate = new Date(created_at);
    const currentDate = new Date();
    const warmup_days = Math.floor(
      (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    let status = "";

    // Apply the rules
    if (warmup_days > 30 && health < 90) {
      status = "failed";
    } else if (health >= 98 && warmup_days >= 14) {
      status = "ready";
    } else if (health < 98) {
      status = "warming";
    } else {
      status = "warming"; // Default for edge cases
    }

    results.push({
      email,
      status,
      health,
      warmup_days,
    });
  }

  // Update Supabase
  for (const result of results) {
    logger.info(
      `Updating mailbox: ${result.email} | ${result.health} | ${result.status}`,
    );
    const { error, data } = await supabase
      .from("mailboxes")
      .update({
        status: result.status,
        health: result.health,
        warmup_days: result.warmup_days,
      })
      .ilike("email", result.email);
    console.log(data);

    if (error) logger.error(`Error updating ${result.email}:`, error);
  }
};

export const handler: Handlers["checkMailboxStatus"] = async ({ logger }) => {
  // fetch all pending dns
  try {
    const { error, data } = await supabase.from("domains").select("*");
    if (error) {
      logger.error("Error fetching domains info from Database");
      return; // Exit early if there's an error
    }

    // Loop through all fetched records
    for (const record of data) {
      logger.info(`Processing record: ${record.id} | ${record.domain}`);
      if (record.plusvibe_workspace) {
        await getUpdatedMailboxInfo(record.plusvibe_workspace, logger);
      }
    }
    logger.info("CRON DONE UPDATING THE STATUS OF THE MAILBOXES");
  } catch (error) {
    logger.error(`Error updating the status of the mailboxes - ${error}`);
  }
};
