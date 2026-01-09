import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "FetchMailcowToken",
  type: "api",
  description: "Endpoint to call to extract the mailcow token",
  flows: ["MailCowManagement"],
  emits: ["fetch.mailcow.apitoken"],
  path: "/mailcow/extract-apitoken/:domain",
  method: "GET",
};

export const handler: Handlers["FetchMailcowToken"] = async (
  req,
  { emit, logger },
) => {
  try {
    const domain = req.pathParams.domain;

    await emit({
      topic: "fetch.mailcow.apitoken",
      data: {
        domain: domain,
      },
    });

    return { status: 200, body: "EXTRACTION REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error getting creating domain - ${error}`);
    return { status: 500, body: "EXTRACTION REQUESTS NOT SENT" };
  }
};
