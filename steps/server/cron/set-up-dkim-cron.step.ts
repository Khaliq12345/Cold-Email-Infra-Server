import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "ConfigureDKIMCron",
  description: "Set the DKIM is the domain is created on mailcow",
  cron: "*/5 * * * *",
  emits: ["configure.dkim"],
  flows: ["ServerManagement"],
};

export const handler: Handlers["ConfigureDKIMCron"] = async ({
  emit,
  logger,
}) => {
  // fetch all pending dns
  try {
    const { error, data } = await supabase
      .from("mailcow")
      .select(
        `
        *,
        domains!inner (
          *
        )
      `,
      )
      .eq("mailcow_domain_created", true)
      .or("dkim.is.false, dkim.is.null", { foreignTable: "domains" });

    if (error) {
      logger.error("Error fetching mailcow info from Database");
      return; // Exit early if there's an error
    }
    // Loop through all fetched records
    for (const record of data) {
      console.log(record);
      logger.info(`Processing record: ${record.domain}`);
      await emit({
        topic: "configure.dkim",
        data: {
          domain: record.domain,
        },
      });
    }
    logger.info("CRON DONE CONFIGURING DKIM");
  } catch (error) {
    logger.error(`Error CONFIGURING DKIM - ${error}`);
  }
};
