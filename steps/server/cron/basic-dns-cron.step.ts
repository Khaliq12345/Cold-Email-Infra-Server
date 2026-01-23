import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { serverStatus } from "../../services/server/server";

export const config: CronConfig = {
  type: "cron",
  name: "setBasicDnsCron",
  description:
    "Check the status of a server and setup it's basic dns if it is ready",
  cron: "*/5 * * * *",
  emits: ["dns.basic.create"],
  flows: ["ServerManagement"],
};

export const handler: Handlers["setBasicDnsCron"] = async ({
  emit,
  logger,
}) => {
  try {
    // Get all running server with no dns configured
    logger.info("CHECKING IF DNS IS SET ON RUNNING SERVERS");
    const { error, data } = await supabase
      .from("domains")
      .select("*, servers(*)")
      .not("basic_dns", "is", true)
      .eq("servers.status", serverStatus.running);
    if (error) {
      logger.error("Error fetching Pending Servers");
    }

    // Go through all records and setup the basic dns
    for (const record of data) {
      logger.info(`Processing DOMAIN - ${record.domain}`);
      await emit({
        topic: "dns.basic.create",
        data: {
          domain: record.domain,
          ipaddress: record.servers.ipaddress,
          username: record.username,
        },
      });
      logger.info(`DOMAIN - ${record.domain} DNS is set`);
    }
  } catch (error) {
    logger.error(`Error updating the servers - ${error}`);
  }
};
