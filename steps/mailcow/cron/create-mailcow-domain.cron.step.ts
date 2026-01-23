import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  name: "CreateMailcowDomainCron",
  type: "cron",
  description: "CRON job to create mailcow domain",
  flows: ["MailCowManagement"],
  emits: ["create.mailcow.domain"],
  cron: "*/10 * * * *",
};

export const handler: Handlers["CreateMailcowDomainCron"] = async ({
  logger,
  emit,
}) => {
  try {
    logger.info(`Fetching the mailcow with api token`);
    // Fetch the domain that to resolves to the right ip
    const { error, data } = await supabase
      .from("mailcow")
      .select("*")
      .not("token", "is", null)
      .not("mailcow_domain_created", "is", true);

    if (!data || data.length == 0) {
      logger.info("NO RECORDS TO PROCESS");
      return;
    }

    // Go through the records and get the api token from mailcow
    for (const record of data) {
      logger.info(`Processing record - ${record.domain}`);
      await emit({
        topic: "create.mailcow.domain",
        data: {
          domain: record.domain,
        },
      });
    }
    logger.info(`Done Processing records`);
  } catch (error) {
    logger.error(`Error fetching mailcow with api token - ${error}`);
  }
};
