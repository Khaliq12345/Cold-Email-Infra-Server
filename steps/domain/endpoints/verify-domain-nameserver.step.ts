import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "VerifyDomainNameservers",
  type: "api",
  description: "Endpoint to verify domain nameserver",
  flows: ["DomainManagement"],
  path: "/domains/verify-nameservers",
  emits: ["domain.verifynameservers"],
  method: "GET",
  // middleware: [authMiddleware],
};

export const handler: Handlers["VerifyDomainNameservers"] = async (
  req,
  { logger, emit },
) => {
  try {
    await emit({
      topic: "domain.verifynameservers",
      data: {},
    });
  } catch (error) {
    logger.error(`Error verifying domain nameservers - ${error}`);
    return {
      status: 500,
      body: {
        error: "Failed to verify domain nameservers",
        details: error,
      },
    };
  }
};
