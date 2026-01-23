import { CronConfig, Handlers } from "motia";
import { serverStatus, instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

export const config: CronConfig = {
  type: "cron",
  name: "CreateServerCron",
  description: "Cron job that create a server",
  cron: "*/5 * * * *",
  emits: ["server.create"],
  flows: ["ServerManagement"],
};

export const handler: Handlers["CreateServerCron"] = async ({
  emit,
  logger,
}) => {
  try {
    // Get all pending servers
    const { data, error } = await supabase
      .from("domains")
      .select(
        `
        *,
        servers!left(*)
      `,
      )
      .is("nameserver", true)
      .is("servers", null);

    if (error) {
      logger.error("Error fetching Domains with verified servers");
    }

    if (data) {
      for (const row of data) {
        logger.info(`Record - ${row.domain} | Plan - ${row.plan}`);
        await emit({
          topic: "server.create",
          data: {
            username: row.username,
            domain: row.domain,
            plan: row.plan,
          },
        });
        logger.info(`Server ${row.domain} updated`);
      }
    }
  } catch (error) {
    logger.error(`Error updating the servers - ${error}`);
  }
};
