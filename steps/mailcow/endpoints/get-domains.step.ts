import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { verifyNameServers } from "../../services/utilsDomain/whatDomain";

export const config: ApiRouteConfig = {
  name: "GetDomains",
  type: "api",
  description: "Endpoint to call the create mailboxes",
  flows: ["MailCowManagement"],
  path: "/mailcow/domains/:username",
  emits: [],
  method: "GET",
  // middleware: [authMiddleware],
};

export const handler: Handlers["GetDomains"] = async (req, { logger }) => {
  const { username } = req.pathParams;
  // Expected nameservers
  const expectedNameservers = [
    "hydrogen.ns.hetzner.com.",
    "oxygen.ns.hetzner.com.",
    "helium.ns.hetzner.de.",
  ];
  try {
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .eq("username", username);

    if (!data) {
      return { status: 200, body: [] };
    }
    const updateDomainInfo = [];
    for (const domainInfo of data) {
      let isValid = false;
      try {
        isValid = await verifyNameServers(
          expectedNameservers,
          domainInfo.domain,
        );
      } catch (error) {
        console.log("Error - ", error);
      } finally {
        domainInfo.nameserver = isValid;
        updateDomainInfo.push(domainInfo);
      }
    }
    return { status: 200, body: updateDomainInfo };
  } catch (error) {
    logger.error(`Error getting domains - ${error}`);
    return { status: 500, body: { details: error } };
  }
};
