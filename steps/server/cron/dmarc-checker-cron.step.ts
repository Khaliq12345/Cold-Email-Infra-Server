import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "checkDmarcStatus",
  description: "Check the status of the dmarc dns and update it if it is ready",
  cron: "0 */3 * * *",
  emits: ["configure.dmarc"],
  flows: ["ServerManagement"],
};

export const handler: Handlers["checkDmarcStatus"] = async ({
  emit,
  logger,
}) => {
  // fetch all pending dns
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    logger.info(`10 minutes ago - ${tenMinutesAgo}`);
    const { error, data } = await supabase
      .from("domains")
      .select("*")
      .is("dmarc", false)
      .lte("dkim_set_date", tenMinutesAgo);
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
