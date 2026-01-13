import { ApiRouteConfig, Handlers } from "motia";
import { verifyNameServers } from "../../services/utilsDomain/whatDomain";

export const config: ApiRouteConfig = {
  name: "VerifyNameServers",
  type: "api",
  description: "Endpoint to verify domain nameserver",
  flows: ["DomainManagement"],
  path: "/domains/verify-nameserver/:domain",
  emits: [],
  method: "GET",
  // middleware: [authMiddleware],
};

export const handler: Handlers["VerifyNameServers"] = async (
  req,
  { logger },
) => {
  try {
    const { domain } = req.pathParams;
    logger.info(`Checking domain name server: ${domain}`);

    // Expected nameservers
    const expectedNameservers = [
      "hydrogen.ns.hetzner.com.",
      "oxygen.ns.hetzner.com.",
      "helium.ns.hetzner.de.",
    ];
    const isValid = await verifyNameServers(expectedNameservers, domain);
    if (isValid) {
      logger.info(`Domain ${domain} has correct nameservers`);
      return {
        status: 200,
        body: {
          success: true,
          details: "Domain nameservers verified successfully",
        },
      };
    } else {
      logger.warn(`Domain ${domain} has incorrect nameservers`);
      return {
        status: 400,
        body: {
          success: false,
          details: "Domain nameservers do not match expected configuration",
          expected: expectedNameservers,
        },
      };
    }
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
