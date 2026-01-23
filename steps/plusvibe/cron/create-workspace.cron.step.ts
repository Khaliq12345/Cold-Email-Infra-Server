import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "CreateWorkspaceCron",
  description: "Setup Plusvibe workspace if Dmarc is ready",
  cron: "*/10 * * * *",
  emits: ["plusvibe.workspace.create"],
  flows: ["PlusvibeManagement"],
};

export const handler: Handlers["CreateWorkspaceCron"] = async ({
  emit,
  logger,
}) => {
  // fetch all pending dmarc ready domains
  try {
    const { error, data } = await supabase
      .from("domains")
      .select("*")
      .is("dmarc", true)
      .is("plusvibe_workspace", null);

    if (error) {
      logger.error("Error fetching Dmarc ready domains from Database");
      return;
    }
    // Loop through all fetched records
    for (const record of data) {
      logger.info(`Processing record: ${record.domain}`);
      await emit({
        topic: "plusvibe.workspace.create",
        data: {
          domain: record.domain,
          workspace_name: record.domain,
        },
      });
    }
    logger.info("CRON DONE SETTING UP THE WORKSPACE");
  } catch (error) {
    logger.error(`Error setting up the workspace - ${error}`);
  }
};
