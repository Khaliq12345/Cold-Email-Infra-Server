import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "AddMailboxAccountsCron",
  description: "Cron job to add mailbox accounts to plusvibe",
  cron: "*/10 * * * *",
  emits: ["plusvibe.add.mailboxes"],
  flows: ["PlusvibeManagement"],
};

export const handler: Handlers["AddMailboxAccountsCron"] = async ({
  emit,
  logger,
}) => {
  // fetch all domains connected to plusvibe
  try {
    const { error, data } = await supabase
      .from("domains")
      .select("*")
      .not("plusvibe_workspace", "is", null);

    if (error) {
      logger.error("Error fetching domains connected to plusvibe");
      return;
    }
    // Loop through all fetched records
    for (const record of data) {
      logger.info(`Processing record: ${record.domain}`);
      await emit({
        topic: "plusvibe.add.mailboxes",
        data: {
          domain: record.domain,
        },
      });
    }
    logger.info("CRON DONE ADDING ALL MAILBOXES");
  } catch (error) {
    logger.error(`Error setting up the mailboxes in plusvibe - ${error}`);
  }
};
