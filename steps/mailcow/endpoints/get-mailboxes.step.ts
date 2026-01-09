import { ApiRouteConfig, Handlers } from "motia";
import { MailcowInstance } from "../../services/mailcow/mailcow";

export const config: ApiRouteConfig = {
  name: "GetMailboxes",
  type: "api",
  description: "Endpoint to call to get the mailboxes for a particular domain",
  flows: ["MailCowManagement"],
  path: "/mailcow/mailboxes/:domain",
  emits: [],
  method: "GET",
};

export const handler: Handlers["GetMailboxes"] = async (req, { logger }) => {
  const { domain } = req.pathParams;
  try {
    const instance = await MailcowInstance(domain);
    const response = await instance.get(`/get/mailbox/all`);
    return { status: 200, body: response.data };
  } catch (error) {
    logger.error(`Error getting mailboxes for domain ${domain} - ${error}`);
    return { status: 500, body: { details: error } };
  }
};
