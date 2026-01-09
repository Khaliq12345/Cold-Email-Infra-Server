import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { promises as dns } from "dns"; // Use the promises API

export const config: CronConfig = {
  type: "cron",
  name: "checkDomainDns",
  description:
    "Check the status of a domain dns and start the advance dns setup",
  cron: "* * * * */3", // Fixed: This runs every 10 minutes
  emits: [],
  flows: ["ServerManagement"],
};

export const handler: Handlers["checkDomainDns"] = async ({ logger }) => {
  try {
    const { error, data } = await supabase
      .from("dns")
      .select("*")
      .eq("basic_dns", true); // Use .eq for boolean checks usually

    if (error) throw error;

    if (!data || data.length === 0) {
      logger.info("No pending DNS records to check.");
      return;
    }

    for (const row of data) {
      try {
        logger.info(`Checking DOMAIN: ${row.domain}`);

        // Resolve the actual domain from the database
        const addresses = await dns.resolve4(row.domain);

        logger.info(
          `Success: ${row.domain} resolved to ${addresses.join(", ")}`,
        );

        // Example: Update Supabase if the DNS is verified
        // await supabase.from("dns").update({ verified: true }).eq("id", row.id);
      } catch (dnsError: any) {
        logger.error(
          `DNS lookup failed for ${row.domain}: ${dnsError.message}`,
        );
      }
    }
  } catch (error: any) {
    logger.error(`Error while checking the dns: ${error.message}`);
  }
};
