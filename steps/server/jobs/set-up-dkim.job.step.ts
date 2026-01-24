import { EventConfig, Handlers } from "motia";
import { extractDKIM } from "../../services/mailcow/mailcow";
import { instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

function formatDkimValue(dkimTxt: string) {
  const maxLength = 255;
  if (dkimTxt.length <= maxLength) return `"${dkimTxt}"`;

  const chunks = [];
  for (let i = 0; i < dkimTxt.length; i += maxLength) {
    chunks.push(dkimTxt.substring(i, i + maxLength));
  }
  return chunks.map((chunk) => `"${chunk}"`).join(" ");
}

export const config: EventConfig = {
  name: "ConfigureDKIMJob",
  type: "event",
  description: "Background job to add DKIM to the DNS",
  flows: ["MailCowManagement"],
  emits: [],
  subscribes: ["configure.dkim"],
};

export const handler: Handlers["ConfigureDKIMJob"] = async (
  input,
  { emit, logger },
) => {
  const { domain } = input;

  try {
    // 1. Pre-check: Check if DKIM is already marked as true in the DB
    const { data: domainData, error: fetchError } = await supabase
      .from("domains")
      .select("dkim")
      .eq("domain", domain)
      .single();

    if (fetchError) {
      logger.error(`Error fetching DKIM status: ${fetchError.message}`);
    }

    if (domainData?.dkim === true) {
      logger.info(`DKIM for ${domain} is already set in DB. Skipping...`);
      return;
    }

    // 2. Extract DKIM info
    const dkimInfo = await extractDKIM(domain, logger);
    let dkim_data = {
      name: "dkim._domainkey",
      type: "TXT",
      records: [
        {
          value: formatDkimValue(dkimInfo.dkim_txt),
        },
      ],
    };

    // 3. Request to set DKIM on server
    await instance.post(`v1/zones/${domain}/rrsets`, dkim_data);
    logger.info(`CONFIGURING DKIM FOR - ${domain}`);
    // 4. Update Database on success
    await updateDkimStatus(domain, logger);
  } catch (error: any) {
    // 5. Handle 409 Conflict (Record already exists)
    if (error.response?.status === 409) {
      logger.warn(
        `DKIM for ${domain} already exists on server (409). Syncing DB...`,
      );
      await updateDkimStatus(domain, logger);
    } else {
      logger.error(`Error CONFIGURING DKIM - ${error.message || error}`);
    }
  }
};

/**
 * Helper function to update the database status for DKIM
 */
async function updateDkimStatus(domain: string, logger: any) {
  const { error } = await supabase
    .from("domains")
    .update({
      dkim: true,
      dkim_set_date: new Date().toISOString(),
    })
    .eq("domain", domain);

  if (error) {
    logger.error(`ERROR UPDATING THE DATABASE: ${error.message}`);
  } else {
    logger.info(`DATABASE UPDATED: DKIM marked as set for ${domain}`);
  }
}
