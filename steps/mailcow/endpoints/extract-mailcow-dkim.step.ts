import { ApiRouteConfig, Handlers } from "motia";
import { extractDKIM } from "../../services/mailcow/mailcow";

export const config: ApiRouteConfig = {
  name: "GetMailcowDKIMJob",
  type: "api",
  description: "Endpoint to call to extract dkim from mailcow",
  flows: ["MailCowManagement"],
  emits: [],
  path: "/mailcow/extract-dkim/:domain",
  method: "GET",
};

export const handler: Handlers["GetMailcowDKIMJob"] = async (
  req,
  { emit, logger },
) => {
  try {
    const domain = req.pathParams.domain;
    console.log(domain);

    const dkimInfo = await extractDKIM(domain, logger);

    return { status: 200, body: dkimInfo };
  } catch (error) {
    logger.error(`Error getting creating domain - ${error}`);
    return { status: 500, body: "DKIM REQUESTS NOT SENT" };
  }
};
