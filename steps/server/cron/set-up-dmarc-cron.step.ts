import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "ConfigureDmarcCron",
  description: "Setup Dmarc if it is ready",
  cron: "* * * * *",
  emits: ["configure.dmarc"],
  flows: ["ServerManagement"],
};

export const handler: Handlers["ConfigureDmarcCron"] = async ({
  emit,
  logger,
}) => {
  // fetch all pending dns
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    logger.info(`10 minutes ago - ${oneHourAgo}`);
    const { error, data } = await supabase
      .from("domains")
      .select("*")
      .or("dmarc.is.false,dmarc.is.null")
      .lte("dkim_set_date", oneHourAgo);
    if (error) {
      logger.error("Error fetching DNS from Database");
      return; // Exit early if there's an error
    }
    // Loop through all fetched records
    for (const record of data) {
      logger.info(`Processing record: ${record.id} | ${record.domain}`);
      await emit({
        topic: "configure.dmarc",
        data: {
          domain: record.domain,
        },
      });
    }
    logger.info("CRON DONE CHECKING THE DMARC STATUS");
  } catch (error) {
    logger.error(`Error checking for DNS - ${error}`);
  }
};
