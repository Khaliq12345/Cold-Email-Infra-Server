import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  name: "FetchMailcowTokenCron",
  type: "cron",
  description: "CRON job that fetch mailcow token",
  flows: ["MailCowManagement"],
  emits: ["fetch.mailcow.apitoken"],
  cron: "*/20 * * * *",
};

export const handler: Handlers["FetchMailcowTokenCron"] = async ({
  logger,
  emit,
}) => {
  try {
    logger.info(`Fetching the domains with resolve ip`);
    // Fetch the domain that to resolves to the right ip
    const { error, data } = await supabase
      .from("domains")
      .select("*, mailcow(*)")
      .eq("domain_resolves_to_ip", true);
    if (!data || data.length == 0) {
      return;
    }

    // Go through the records and get the api token from mailcow
    for (const record of data) {
      logger.info(`Processing record - ${record.domain}`);
      if (record.mailcow) {
        logger.info(`Domain api token is fetched - ${record.domain}`);
        continue;
      }
      await emit({
        topic: "fetch.mailcow.apitoken",
        data: {
          domain: record.domain,
        },
      });
    }

    logger.info(`Done Processing records`);
  } catch (error) {
    logger.error(`Error fetching the api token - ${error}`);
    return {
      status: 500,
      body: {
        error: "Failed to fetch the api token",
        details: error,
      },
    };
  }
};
