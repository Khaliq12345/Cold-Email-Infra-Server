import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "ConfigurePtrCron",
  description: "Set the PTR if the domain is created on mailcow",
  cron: "*/5 * * * *",
  emits: ["configure.ptr"],
  flows: ["ServerManagement"],
};

export const handler: Handlers["ConfigurePtrCron"] = async ({
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
            dkim,
            servers (
              ipaddress
            )
          )
        `,
      )
      .eq("mailcow_domain_created", true)
      .or("ptr.is.false, ptr.is.null", { foreignTable: "domains" });

    if (error) {
      logger.error("Error fetching mailcow info from Database");
      return; // Exit early if there's an error
    }
    // Loop through all fetched records
    for (const record of data) {
      logger.info(`Processing record: ${record.domain}`);
      await emit({
        topic: "configure.ptr",
        data: {
          domain: record.domain,
          ipaddress: record.domains.servers.ipaddress,
        },
      });
    }
    logger.info("CRON DONE CONFIGURING PTR");
  } catch (error) {
    logger.error(`Error CONFIGURING PTR - ${error}`);
  }
};
