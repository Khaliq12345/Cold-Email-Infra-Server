import { ApiRouteConfig, Handlers } from "motia";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { queryDomainStatus } from "../../services/utilsDomain/whatDomain";

export const config: ApiRouteConfig = {
  name: "QueryDomainStatus",
  type: "api",
  description: "Endpoint to query domain status from what.domains",
  flows: ["DomainManagement"],
  path: "/domains/status/:domain",
  emits: [],
  method: "GET",
  // middleware: [authMiddleware],
};

export const handler: Handlers["QueryDomainStatus"] = async (
  req,
  { logger },
) => {
  const { domain } = req.pathParams;

  try {
    logger.info(`Querying domain status for: ${domain}`);

    const data = await queryDomainStatus(domain, logger);

    return {
      status: 200,
      body: {
        domain,
        status: data,
      },
    };
  } catch (error) {
    logger.error(`Error querying domain status ${domain} - ${error}`);
    return {
      status: 500,
      body: {
        error: "Failed to query domain status",
        details: error,
      },
    };
  }
};
