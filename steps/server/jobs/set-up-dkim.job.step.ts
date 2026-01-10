import { EventConfig, Handlers } from "motia";
import { extractDKIM } from "../../services/mailcow/mailcow";
import { instance } from "../server-instance";
import { supabase } from "../../services/supabase/supabase";

function formatDkimValue(dkimTxt: string) {
  const maxLength = 255;

  if (dkimTxt.length <= maxLength) {
    return `"${dkimTxt}"`;
  }

  // Split into chunks
  const chunks = [];
  for (let i = 0; i < dkimTxt.length; i += maxLength) {
    chunks.push(dkimTxt.substring(i, i + maxLength));
  }

  // Join with escaped quotes and space
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

  const dkimInfo = await extractDKIM(domain, logger);

  logger.info(`CONFIGURING DKIM FOR - ${domain}`);

  let dkim_data = {
    name: "dkim._domainkey",
    type: "TXT",
    records: [
      {
        value: formatDkimValue(dkimInfo.dkim_txt),
      },
    ],
  };

  await instance.post(`v1/zones/${domain}/rrsets`, dkim_data);
  logger.info("DONE CONFIGURING DKIM; UPDATING THE DATABASE");

  const { data, error } = await supabase
    .from("domains")
    .update({
      dkim: true,
      dkim_set_date: new Date().toISOString(),
    })
    .eq("domain", domain);
  if (error) {
    logger.error("ERROR UPDATING THE DATABASE", error);
  }

  logger.info("DATABASE UPDATED");
};
