import { EventConfig, Handlers } from "motia";
import { instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

export const config: EventConfig = {
  name: "ConfigureDMARCJob",
  type: "event",
  description: "Background job to add DMARC to the DNS",
  flows: ["MailCowManagement"],
  emits: [],
  subscribes: ["configure.dmarc"],
};

export const handler: Handlers["ConfigureDMARCJob"] = async (
  input,
  { emit, logger },
) => {
  const { domain } = input;

  try {
    // 1. Pre-check: Check if DMARC is already set in the DB
    const { data: domainData, error: fetchError } = await supabase
      .from("domains")
      .select("dmarc")
      .eq("domain", domain)
      .single();

    if (fetchError) {
      logger.error(`Error fetching DMARC status: ${fetchError.message}`);
    }

    if (domainData?.dmarc === true) {
      logger.info(`DMARC for ${domain} is already marked as true. Skipping...`);
      return;
    }

    logger.info(`CONFIGURING DMARC FOR - ${domain}`);

    let dmarc_data = {
      name: "_dmarc",
      type: "TXT",
      records: [
        {
          value: '"v=DMARC1; p=none"',
        },
      ],
    };

    // 2. Request to add DMARC record
    await instance.post(`v1/zones/${domain}/rrsets`, dmarc_data);

    // 3. Update DB on success
    await updateDmarcStatus(domain, logger);
  } catch (error: any) {
    // 4. Handle 409 Conflict (Record already exists)
    if (error.response?.status === 409) {
      logger.warn(
        `DMARC for ${domain} already exists on server (409). Syncing DB...`,
      );
      await updateDmarcStatus(domain, logger);
    } else {
      logger.error(`Error CONFIGURING DMARC - ${error.message || error}`);
    }
  }
};

/**
 * Helper function to update the database status for DMARC
 */
async function updateDmarcStatus(domain: string, logger: any) {
  const { error } = await supabase
    .from("domains")
    .update({
      dmarc: true,
    })
    .eq("domain", domain);

  if (error) {
    logger.error(`ERROR UPDATING THE DATABASE (DMARC): ${error.message}`);
  } else {
    logger.info(`DATABASE UPDATED: DMARC marked as set for ${domain}`);
  }
}
