import { ApiRouteConfig, Handlers } from "motia";
import { MailcowInstance } from "../../services/mailcow/mailcow";

export const config: ApiRouteConfig = {
  name: "GetDomainDetails",
  type: "api",
  description: "Endpoint to call to get the domain details",
  flows: ["MailCowManagement"],
  path: "/mailcow/domain/:domain",
  emits: [],
  method: "GET",
};

export const handler: Handlers["GetDomainDetails"] = async (
  req,
  { logger },
) => {
  const { domain } = req.pathParams;
  try {
    const instance = await MailcowInstance(domain);
    const response = await instance.get(`/get/domain/${domain}`);
    return { status: 200, body: response.data };
  } catch (error) {
    logger.error(`Error getting domain details - ${error}`);
    return { status: 500, body: { details: error } };
  }
};
