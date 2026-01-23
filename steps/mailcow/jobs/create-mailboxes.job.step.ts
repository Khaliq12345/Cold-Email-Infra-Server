import { EventConfig, Handlers } from "motia";
import { supabase, domainToken } from "../../services/supabase/supabase";
import axios from "axios";

const generateStr = (len: number) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + len);

export const config: EventConfig = {
  name: "CreateMailboxesJob",
  type: "event",
  description: "Background job to create mailboxes",
  flows: ["MailCowManagement"],
  emits: [],
  subscribes: ["create.mailboxes"],
};

export const handler: Handlers["CreateMailboxesJob"] = async (
  input,
  { logger },
) => {
  const { domain, count } = input;

  logger.info(`CREATING ${count} Mailboxes FOR - ${domain}`);

  // 1. Setup API Configuration
  const MAILCOW_API_BASE = `https://mail.${domain}/api/v1/add/mailbox`;
  const token = await domainToken(domain);
  logger.info(token);

  // Extract prefix from domain (e.g., testcompany.cv -> testcompany)
  const firstNames = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Barbara",
    "David",
    "Elizabeth",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const localpart = `${firstName}-${generateStr(2)}`;
    const fullEmail = `${localpart}@${domain}`;
    const password = generateStr(16);

    try {
      // --- STEP 1: DATABASE FIRST (Record the intent) ---
      const { data: dbRecord, error: dbError } = await supabase
        .from("mailboxes")
        .insert([
          {
            email: fullEmail,
            password: password,
            status: "pending",
            domain: domain,
            first_name: firstName,
            last_name: lastName,
            username: fullEmail,
            imap_host: `mail.${domain}`,
            imap_port: "993",
            smtp_host: `mail.${domain}`,
            smtp_port: "465",
          },
        ])
        .select()
        .single();

      if (dbError) {
        logger.error(
          `Failed to write to DB, skipping API for ${fullEmail}: ${dbError.message}`,
        );
        continue;
      }

      // --- STEP 2: CALL MAILCOW API ---
      try {
        const response = await axios.post(
          MAILCOW_API_BASE,
          {
            local_part: localpart,
            domain: domain,
            name: `${firstName} ${lastName}`,
            quota: "2048",
            password: password,
            password2: password,
            active: "1",
            force_pw_update: "0",
            tls_enforce_in: "1",
            tls_enforce_out: "1",
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": token,
            },
          },
        );

        // --- FIXED LOGIC HERE ---
        // Mailcow returns an array: [{ type: 'success', msg: '...', ... }]
        const result = response.data[0];

        if (result?.type !== "success") {
          // If the API says 'error', we jump to the catch block
          throw new Error(
            `Mailcow API returned: ${result?.msg || "Unknown Error"}`,
          );
        }

        // --- STEP 3: UPDATE DB STATUS ON SUCCESS ---
        await supabase
          .from("mailboxes")
          .update({ is_active: true })
          .eq("email", dbRecord.email);

        logger.info(`✅ Successfully created: ${fullEmail}`);
      } catch (apiError: any) {
        // --- STEP 4: ROLLBACK DB ON API FAILURE ---
        const errorMsg = apiError.response?.data || apiError.message;
        logger.error(`❌ Mailcow API Failed for ${fullEmail}: ${errorMsg}`);

        await supabase.from("mailboxes").delete().eq("id", dbRecord.id);
      }
    } catch (criticalError) {
      logger.error(`Critical error during iteration ${i}: ${criticalError}`);
    }
  }

  logger.info(`Batch processing completed for ${domain}`);
};
