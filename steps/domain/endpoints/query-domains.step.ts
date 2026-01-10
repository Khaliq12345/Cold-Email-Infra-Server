import { ApiRouteConfig, Handlers } from "motia";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { queryDomain } from "../../services/utilsDomain/whatDomain";

export const config: ApiRouteConfig = {
  name: "QueryDomain",
  type: "api",
  description: "Endpoint to query domain information from what.domains",
  flows: ["DomainManagement"],
  path: "/domains/query/:domain",
  emits: [],
  method: "GET",
  // middleware: [authMiddleware],
};

export const handler: Handlers["QueryDomain"] = async (req, { logger }) => {
  const { domain } = req.pathParams;

  try {
    logger.info(`Querying domain information for: ${domain}`);

    const data = await queryDomain(domain, logger);

    return {
      status: 200,
      body: {
        domain,
        data,
      },
    };
  } catch (error) {
    logger.error(`Error querying domain ${domain} - ${error}`);
    return {
      status: 500,
      body: {
        error: "Failed to query domain",
        details: error,
      },
    };
  }
};
