import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "CreateMailcowDomain",
  type: "api",
  description: "Endpoint to call the create mailcow domain",
  flows: ["MailCowManagement"],
  emits: ["create.mailcow.domain"],
  path: "/mailcow/domains/:domain",
  method: "POST",
};

export const handler: Handlers["CreateMailcowDomain"] = async (
  req,
  { emit, logger },
) => {
  try {
    const domain = req.pathParams.domain;

    await emit({
      topic: "create.mailcow.domain",
      data: {
        domain: domain,
      },
    });

    return { status: 200, body: "DOMAIN REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error getting creating domain - ${error}`);
    return { status: 500, body: "DOMAIN REQUESTS NOT SENT" };
  }
};
