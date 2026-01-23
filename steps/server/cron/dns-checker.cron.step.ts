import { CronConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { promises as dns } from "dns";

export const config: CronConfig = {
  type: "cron",
  name: "checkDomainDns",
  description:
    "Check the status of a domain dns and start the advance dns setup",
  cron: "*/5 * * * *",
  emits: [],
  flows: ["ServerManagement"],
};

export const handler: Handlers["checkDomainDns"] = async ({ logger, emit }) => {
  try {
    const { error, data } = await supabase
      .from("domains")
      .select("*, servers(*)")
      .eq("basic_dns", true)
      .or("domain_resolves_to_ip.is.false,domain_resolves_to_ip.is.null");

    if (error) throw error;

    if (!data || data.length === 0) {
      logger.info("No records to check.");
      return;
    }

    for (const domainInfo of data) {
      console.log(domainInfo.servers);
      try {
        logger.info(
          `Checking DOMAIN Resolves to the server's ip addrese: ${domainInfo.domain}`,
        );

        // Resolve the actual domain from the database
        const addresses = await dns.resolve4(domainInfo.domain);
        logger.info(`Address - ${addresses}`);
        const ipaddress = addresses[0];

        logger.info(`Success: ${domainInfo.domain} resolved to ${ipaddress}`);

        // Example: Update Supabase if the DNS is verified
        if (domainInfo.servers.ipaddress.trim() === ipaddress.trim()) {
          await supabase
            .from("domains")
            .update({ domain_resolves_to_ip: true })
            .eq("domain", domainInfo.domain);
        }
      } catch (dnsError: any) {
        logger.error(
          `DNS lookup failed for ${domainInfo.domain}: ${dnsError.message}`,
        );
      }
    }
  } catch (error: any) {
    logger.error(`Error while checking the dns: ${error.message}`);
  }
};
