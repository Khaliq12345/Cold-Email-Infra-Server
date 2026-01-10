import { EventConfig, Handlers } from "motia";
import { instance } from "../server-instance";
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

  await instance.post(`v1/zones/${domain}/rrsets`, dmarc_data);
  logger.info("DONE CONFIGURING DMARC; UPDATING THE DATABASE");

  const { data, error } = await supabase
    .from("domains")
    .update({
      dmarc: true,
    })
    .eq("domain", domain);
  if (error) {
    logger.error("ERROR UPDATING THE DATABASE", error);
  }

  logger.info("DATABASE UPDATED");
};
