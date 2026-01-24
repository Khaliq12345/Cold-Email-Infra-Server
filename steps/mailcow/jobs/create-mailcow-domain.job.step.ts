import { EventConfig, Handlers } from "motia";
import { domainToken } from "../../services/supabase/supabase";
import axios from "axios";
import { supabase } from "../../services/supabase/supabase";

export const config: EventConfig = {
  name: "CreateMailcowDomainJob",
  type: "event",
  description: "Background job to create mailcow domain",
  flows: ["MailCowManagement"],
  emits: [],
  subscribes: ["create.mailcow.domain"],
};

export const handler: Handlers["CreateMailcowDomainJob"] = async (
  input,
  { emit, logger },
) => {
  const { domain } = input;

  logger.info(`CREATING DOMAIN FOR - ${domain}`);

  logger.info("RETRIEVING THE TOKEN");
  const MAILCOW_API_URL = `https://mail.${domain}/api/v1`;
  const token = await domainToken(domain);
  logger.info(token);

  try {
    logger.info("SENDING THE REQUESTS TO CREATE THE DOMAIN");
    await axios.post(
      `${MAILCOW_API_URL}/add/domain`,
      {
        domain: domain,
        description: "Official Company domain",
        aliases: "200",
        mailboxes: "100", // Increased to 100 mailboxes
        defquota: "1024", // Set default to 1GB (1024MB)
        maxquota: "1024", // Set max per mailbox to 1GB
        quota: "102400", // Total domain quota: 100 * 1024 = 102,400MB
        active: "1",
        rl_value: "500",
        rl_frame: "d",
        backupmx: "0",
        relay_all_recipients: "0",
        restart_sogo: "1",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": token,
        },
      },
    );
    // Update the database that the domain is created
    await supabase
      .from("mailcow")
      .update({
        mailcow_domain_created: true,
      })
      .eq("domain", domain);

    logger.info("Domain created successfully");
  } catch (error) {
    logger.error(`Error adding domain: ${error}`);
    throw error;
  }
};
