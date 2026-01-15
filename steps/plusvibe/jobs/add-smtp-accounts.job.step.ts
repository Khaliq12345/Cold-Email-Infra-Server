import { EventConfig, Handlers } from "motia";
import { bulkAddSmtpAccounts } from "../../services/plusvibe/plusvibe";
import {
  getPlusvibeWorkspace,
  supabase,
} from "../../services/supabase/supabase";

export const config: EventConfig = {
  name: "AddMailboxAccountsJob",
  type: "event",
  description: "Background job to add mailbox accounts to plusvibe",
  flows: ["PlusvibeManagement"],
  emits: [],
  subscribes: ["plusvibe.add.mailboxes"],
};

export const handler: Handlers["AddMailboxAccountsJob"] = async (
  input,
  { logger },
) => {
  const { domain } = input;
  const workspaceId = await getPlusvibeWorkspace(domain);

  logger.info(`Adding all accounts of DOMAIN - ${domain} to plusvibe`);

  try {
    logger.info("RETRIEVING THE ACCOUNTS FROM SUPABASE");

    const { data, error } = await supabase
      .from("mailboxes")
      .select("*")
      .eq("domain", domain)
      .or("added_to_plusvibe.eq.false,added_to_plusvibe.is.null");

    if (error) {
      logger.error("Error fetching from Supabase:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      logger.info(`No pending Mailbox Accounts found for domain: ${domain}`);
      return;
    }

    // 1. Prepare the accounts array
    const accountsToProcess = data.map((record) => ({
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      username: record.username,
      password: record.password,
      imap_host: record.imap_host,
      imap_port: Number(record.imap_port),
      smtp_host: record.smtp_host,
      smtp_username: record.email,
      smtp_password: record.password,
      smtp_port: Number(record.smtp_port),
    }));

    // 2. Execute Bulk Add
    logger.info(`Sending ${accountsToProcess.length} accounts to PlusVibe API`);

    await bulkAddSmtpAccounts(workspaceId, accountsToProcess, logger);

    // 3. Success! Update Supabase in bulk
    logger.info("UPDATING SUPABASE RECORDS STATUS");

    const accountEmails = data.map((record) => record.email);

    const { error: updateError } = await supabase
      .from("mailboxes")
      .update({ added_to_plusvibe: true })
      .in("email", accountEmails); // Efficiently updates all processed emails at once

    if (updateError) {
      logger.error("Error updating Supabase status:", updateError);
    }

    logger.info("Mailboxes Accounts Added and Supabase updated successfully");
  } catch (error) {
    logger.error("Error in AddMailboxAccountsJob:", error);
    throw error;
  }
};
