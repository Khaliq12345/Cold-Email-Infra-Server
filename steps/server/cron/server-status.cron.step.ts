import { CronConfig, Handlers } from "motia";
import { serverStatus, instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "checkStatus",
  description: "Check the status of a server and update it if it is ready",
  cron: "*/10 * * * *",
  emits: [],
  flows: ["ServerManagement"],
};

export const handler: Handlers["checkStatus"] = async ({ emit, logger }) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    logger.info(`10 minutes ago - ${tenMinutesAgo}`);

    // Get all pending servers
    const { error, data } = await supabase
      .from("servers")
      .select("*")
      .eq("status", serverStatus.pending)
      .lte("created_at", tenMinutesAgo);

    if (error) {
      logger.error("Error fetching Pending Servers");
    }

    if (data) {
      for (const row of data) {
        logger.info(row.server_name, row.server_id);
        const response = await instance.get(`/v1/servers/${row.server_id}`);
        logger.info("Updating");

        const status = response.data.server.status;
        const ipaddress = response.data.server.public_net.ipv4.ip;
        if (status === "running") {
          // Update the database with the running status
          await supabase
            .from("servers")
            .update({
              status: serverStatus.running,
              ipaddress: ipaddress,
            })
            .eq("server_id", row.server_id);
        }
        logger.info(`Server ${row.server_name} updated`);
      }
    }
  } catch (error) {
    logger.error(`Error updating the servers - ${error}`);
  }
};
