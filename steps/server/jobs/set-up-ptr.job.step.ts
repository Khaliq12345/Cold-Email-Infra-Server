import { EventConfig, Handlers } from "motia";
import { instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

export const config: EventConfig = {
  name: "ConfigurePtrJob",
  type: "event",
  description: "Background job to add PTR to the DNS",
  flows: ["MailCowManagement"],
  emits: [],
  subscribes: ["configure.ptr"],
};

export const handler: Handlers["ConfigurePtrJob"] = async (
  input,
  { emit, logger },
) => {
  const { ipaddress, domain } = input;
  const mailDomain = `mail.${domain}`;

  try {
    // 1. Pre-check: Check if PTR is already marked as true in the DB
    const { data: domainData, error: fetchError } = await supabase
      .from("domains")
      .select("ptr")
      .eq("domain", domain)
      .single();

    if (fetchError) {
      logger.error(`Error fetching PTR status: ${fetchError.message}`);
    }

    if (domainData?.ptr === true) {
      logger.info(
        `PTR for ${domain} (${ipaddress}) is already set in DB. Skipping...`,
      );
      return;
    }

    logger.info(`CONFIGURING PTR FOR - ${ipaddress}`);

    // 2. Lookup the Primary IP ID
    const response = await instance.get(`/v1/primary_ips?ip=${ipaddress}`);

    if (!response.data.primary_ips || response.data.primary_ips.length === 0) {
      throw new Error(`No primary IP found for address: ${ipaddress}`);
    }

    const primary_ip_id = response.data.primary_ips[0].id;
    logger.info(`PRIMARY IP ID FOUND - ${primary_ip_id}`);

    // 3. Request to change the DNS PTR
    await instance.post(
      `/v1/primary_ips/${primary_ip_id}/actions/change_dns_ptr`,
      {
        ip: ipaddress,
        dns_ptr: mailDomain,
      },
    );

    // 4. Update Database on success
    await updatePtrStatus(domain, logger);
  } catch (error: any) {
    // 5. Handle 409 Conflict (PTR already matches/exists)
    if (error.response?.status === 409) {
      logger.warn(
        `PTR for ${ipaddress} already matches ${mailDomain} (409). Syncing DB...`,
      );
      await updatePtrStatus(domain, logger);
    } else {
      logger.error(`Error CONFIGURING PTR - ${error.message || error}`);
    }
  }
};

/**
 * Helper function to update the database status for PTR
 */
async function updatePtrStatus(domain: string, logger: any) {
  const { error } = await supabase
    .from("domains")
    .update({
      ptr: true,
    })
    .eq("domain", domain);

  if (error) {
    logger.error(`ERROR UPDATING THE DATABASE (PTR): ${error.message}`);
  } else {
    logger.info(`DATABASE UPDATED: PTR marked as set for ${domain}`);
  }
}
