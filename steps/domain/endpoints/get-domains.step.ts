import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const config: ApiRouteConfig = {
  name: "GetDomains",
  type: "api",
  description: "Endpoint to call to retrieve domains for a username",
  flows: ["DomainManagement"],
  path: "/domains/:username",
  emits: [],
  method: "GET",
  // middleware: [authMiddleware],
};

export const handler: Handlers["GetDomains"] = async (req, { logger }) => {
  const { username } = req.pathParams;
  try {
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .eq("username", username);

    if (!data) {
      return { status: 200, body: [] };
    }
    return { status: 200, body: data };
  } catch (error) {
    logger.error(`Error getting domains - ${error}`);
    return { status: 500, body: { details: error } };
  }
};
