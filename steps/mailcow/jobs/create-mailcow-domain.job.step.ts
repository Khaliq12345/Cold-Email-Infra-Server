import { EventConfig, Handlers } from "motia";
import { domainToken } from "../../services/supabase/supabase";
import axios from "axios";

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

  try {
    logger.info("SENDING THE REQUESTS TO CREATE THE DOMAIN");
    await axios.post(
      `${MAILCOW_API_URL}/add/domain`,
      {
        domain: domain,
        description: "Test company domain",
        aliases: "200",
        mailboxes: "100", // 50 mailboxes allowed
        defquota: "2048", // 2GB default quota
        maxquota: "2048", // 10GB max per mailbox
        quota: "80200", // 50GB total quota
        active: "1", // Active (1 = yes, 0 = no)
        rl_value: "100", // Rate limit: 100 emails
        rl_frame: "d", // per hour (s=second, m=minute, h=hour, d=day)
        backupmx: "0", // Not a backup MX (0 = no, 1 = yes)
        relay_all_recipients: "0", // Relay all recipients (1 = yes, 0 = no)
        restart_sogo: "1", // Restart SOGo after adding (1 = yes, 0 = no)
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": token,
        },
      },
    );

    logger.info("Domain created successfully");
  } catch (error) {
    logger.error("Error adding domain:", error);
    throw error;
  }
};
