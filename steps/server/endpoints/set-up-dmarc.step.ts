import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "ConfigureDMARC",
  type: "api",
  description: "Endpoint to call for DMARC configuration",
  flows: ["ServerManagement"],
  emits: ["configure.dmarc"],
  path: "/server/setup-dmarc/:domain",
  method: "GET",
};

export const handler: Handlers["ConfigureDMARC"] = async (
  req,
  { emit, logger },
) => {
  try {
    const domain = req.pathParams.domain;

    await emit({
      topic: "configure.dmarc",
      data: {
        domain: domain,
      },
    });

    return { status: 200, body: "DMARC CONFIGURE REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error setting up dmarc for domain - ${error}`);
    return { status: 500, body: "DMARC CONFIGURE NOT SENT" };
  }
};
