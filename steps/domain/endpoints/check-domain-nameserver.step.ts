import { ApiRouteConfig, Handlers } from "motia";
import { queryDomainNameservers } from "../../services/utilsDomain/whatDomain";

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

    const nameservers = await queryDomainNameservers(domain);
    console.log(nameservers);

    // Expected nameservers
    const expectedNameservers = [
      "hydrogen.ns.hetzner.com.",
      "oxygen.ns.hetzner.com.",
      "helium.ns.hetzner.de.",
    ];

    // Extract nameserver names from the response
    const actualNameservers = nameservers.map((ns: any) => ns.name);

    // Check if all expected nameservers are present
    const allMatch = expectedNameservers.every((expected) =>
      actualNameservers.includes(expected),
    );

    // Check if there are any extra nameservers
    const hasOnlyExpected = actualNameservers.every((actual: string) =>
      expectedNameservers.includes(actual),
    );

    const isValid = allMatch && hasOnlyExpected;

    if (isValid) {
      logger.info(`Domain ${domain} has correct nameservers`);
      return {
        status: 200,
        body: {
          success: true,
          details: "Domain nameservers verified successfully",
          nameservers: actualNameservers,
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
          actual: actualNameservers,
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
