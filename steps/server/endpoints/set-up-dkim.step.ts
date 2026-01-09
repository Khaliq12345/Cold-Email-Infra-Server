import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "ConfigureDKIM",
  type: "api",
  description: "Endpoint to call for DKIM configuration",
  flows: ["ServerManagement"],
  emits: ["configure.dkim"],
  path: "/server/setup-dkim/:domain",
  method: "GET",
};

export const handler: Handlers["ConfigureDKIM"] = async (
  req,
  { emit, logger },
) => {
  try {
    const domain = req.pathParams.domain;

    await emit({
      topic: "configure.dkim",
      data: {
        domain: domain,
      },
    });

    return { status: 200, body: "DKIM CONFIGURE REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error setting up dkm for domain - ${error}`);
    return { status: 500, body: "DKIM CONFIGURE NOT SENT" };
  }
};
