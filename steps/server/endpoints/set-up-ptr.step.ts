import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "ConfigurePRT",
  type: "api",
  description: "Endpoint to call for PTR configuration",
  flows: ["ServerManagement"],
  emits: ["configure.ptr"],
  path: "/server/setup-ptr",
  method: "GET",
};

export const handler: Handlers["ConfigurePRT"] = async (
  req,
  { emit, logger },
) => {
  try {
    const { domain, ipaddress } = req.queryParams;
    console.log(domain, ipaddress, "see");

    await emit({
      topic: "configure.ptr",
      data: {
        domain: domain,
        ipaddress: ipaddress,
      },
    });

    return { status: 200, body: "PTR CONFIGURE REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error setting up ptr for domain - ${error}`);
    return { status: 500, body: "PTR CONFIGURE NOT SENT" };
  }
};
