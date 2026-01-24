import { ApiRouteConfig, Handlers } from "motia";
import { instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

export const config: ApiRouteConfig = {
  name: "BasicDnsCreateJob",
  type: "event",
  description: "Background Job to setup basic dns",
  flows: ["ServerManagement"],
  subscribes: ["dns.basic.create"],
  emits: [],
};

export const handler: Handlers["BasicDnsCreateJob"] = async (
  input,
  { logger },
) => {
  const { domain, ipaddress, username } = input;

  try {
    // 1. Check if basic_dns is already true for this domain
    const { data: domainData, error: fetchError } = await supabase
      .from("domains")
      .select("basic_dns")
      .eq("domain", domain)
      .single();

    if (fetchError) {
      logger.error(`Error fetching domain status: ${fetchError.message}`);
    }

    if (domainData?.basic_dns === true) {
      logger.info(`DNS for ${domain} is already marked as set. Skipping...`);
      return;
    }

    // 2. Send the requests to create the dns
    logger.info(`SETTING UP THE DNS >>>>> ${domain} - ${ipaddress}`);

    const response = await instance.post(
      "/v1/zones",
      JSON.stringify({
        name: domain,
        mode: "primary",
        ttl: 3600,
        rrsets: [
          { name: "@", type: "A", records: [{ value: ipaddress }] },
          { name: "mail", type: "A", records: [{ value: ipaddress }] },
          { name: "@", type: "MX", records: [{ value: `10 mail.${domain}.` }] },
          {
            name: "autodiscover",
            type: "CNAME",
            records: [{ value: `mail.${domain}.` }],
          },
          {
            name: "autoconfig",
            type: "CNAME",
            records: [{ value: `mail.${domain}.` }],
          },
          {
            name: "_autodiscover._tcp",
            type: "SRV",
            records: [{ value: `0 0 443 mail.${domain}.` }],
          },
          {
            name: "@",
            type: "TXT",
            records: [{ value: '"v=spf1 mx a -all"' }],
          },
        ],
      }),
    );

    logger.info(`Zone created: ${response.data.zone.name}`);

    // 3. Update DB after successful creation
    await updateDnsStatus(domain, logger);
  } catch (error: any) {
    // 4. Handle 409 Conflict (Already Exists)
    if (error.response?.status === 409) {
      logger.warn(
        `DNS for ${domain} already exists on server (409). Syncing DB...`,
      );
      await updateDnsStatus(domain, logger);
    } else {
      logger.error(`Error Setting up the BASIC DNS - ${error.message}`);
    }
  }
};

/**
 * Helper function to update the database status
 */
async function updateDnsStatus(domain: string, logger: any) {
  const { error } = await supabase
    .from("domains")
    .update({ basic_dns: true })
    .eq("domain", domain);

  if (error) {
    logger.error(
      `Unable to save the dns info into the database - ${error.message}`,
    );
  } else {
    logger.info(`BASIC DNS IS SET (Synced) for ${domain}`);
  }
}
