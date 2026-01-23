import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: ApiRouteConfig = {
  name: "GetMailboxes",
  type: "api",
  description: "Endpoint to get mailboxes",
  flows: ["MailboxeManagement"],
  path: "/mailboxes/:domain",
  emits: [],
  method: "GET",
};

export const handler: Handlers["GetMailboxes"] = async (req, { logger }) => {
  try {
    const { domain } = req.pathParams;
    logger.info(`GETTING MAILBOXES: ${domain}`);

    const { error, data } = await supabase
      .from("mailboxes")
      .select("*")
      .eq("domain", domain);
    if (error) {
      console.log(error);
      throw Error("Error Getting the MAILBOXES database");
    }

    return {
      status: 200,
      body: data,
    };
  } catch (error) {
    logger.error(`Error Getting the MAILBOXES - ${error}`);
    return {
      status: 500,
      body: {
        error: "Error Getting the MAILBOXES ",
        details: error,
      },
    };
  }
};
