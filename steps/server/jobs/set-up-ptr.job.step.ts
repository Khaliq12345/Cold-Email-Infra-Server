import { EventConfig, Handlers } from "motia";
import { instance } from "../server-instance";
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

  logger.info(`CONFIGURING PTR FOR - ${ipaddress}`);

  let response = await instance.get(`/v1/primary_ips?ip=${ipaddress}`);
  const primary_ip_id = response.data.primary_ips[0].id;
  logger.info(`PRIMARY IP - ${primary_ip_id}`);

  await instance.post(
    `/v1/primary_ips/${primary_ip_id}/actions/change_dns_ptr`,
    {
      ip: ipaddress,
      dns_ptr: mailDomain,
    },
  );
  logger.info("DONE CONFIGURING PTR; UPDATING THE DATABASE");

  const { data, error } = await supabase
    .from("domains")
    .update({
      ptr: true,
    })
    .eq("domain", domain);
  if (error) {
    logger.error("ERROR UPDATING THE DATABASE", error);
  }

  logger.info("DATABASE UPDATED");
};
