import { CronConfig, Handlers } from "motia";
import { serverStatus } from "../server-status";
import { instance } from "../server-instance";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "checkStatus",
  description: "Check the status of a server and update it if it is ready",
  cron: "0 */3 * * *",
  emits: [],
  flows: ["ServerManagement"],
};

export const handler: Handlers["checkStatus"] = async ({ emit, logger }) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    logger.info(`10 minutes ago - ${tenMinutesAgo}`);

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
        console.log("Server response", response);
        logger.info("Updating");

        const status = response.data.server.status;
        if (status === "running") {
          await supabase
            .from("servers")
            .update({
              status: serverStatus.running,
            })
            .eq("server_id", row.server_id);
        }
        logger.info(`Server ${row.server_name} updated`);
        //Emit an event to start the basic dns config
      }
    }
  } catch (error) {
    logger.error(`Error updating the servers - ${error}`);
  }
};
