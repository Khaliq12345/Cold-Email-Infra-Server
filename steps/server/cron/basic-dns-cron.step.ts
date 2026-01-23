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
      .from("users")
      .select("*, servers(*), domains(*)")
      .eq("servers.status", serverStatus.running);
    if (error) {
      logger.error("Error fetching Pending Servers");
    }

    // Go through all records and setup the basic dns
    for (const record of data) {
      for (const serverInfo of record.servers) {
        logger.info(`Processing Server and Domain - ${serverInfo.domain}`);
        const domainInfo = record.domains.find(
          (domain: any) => domain.domain === serverInfo.domain,
        );
        if (domainInfo) {
          logger.info(`Basic DNS is already set - ${serverInfo.domain}`);
          continue;
        }
        if (serverInfo.status === "running") {
          await emit({
            topic: "dns.basic.create",
            data: {
              domain: serverInfo.domain,
              ipaddress: serverInfo.ipaddress,
              username: serverInfo.username,
            },
          });
          logger.info(`DOMAIN - ${serverInfo.domain} DNS is set`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error updating the servers - ${error}`);
  }
};
