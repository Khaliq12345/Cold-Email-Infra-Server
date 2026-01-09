import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const config: ApiRouteConfig = {
  name: "GetDomains",
  type: "api",
  description: "Endpoint to call the create mailboxes",
  flows: ["MailCowManagement"],
  path: "/mailcow/domains/:username",
  emits: [],
  method: "GET",
  middleware: [authMiddleware],
};

export const handler: Handlers["GetDomains"] = async (req, { logger }) => {
  const { username } = req.pathParams;
  try {
    const { data, error } = await supabase
      .from("dns")
      .select("*")
      .eq("username", username);
    return { status: 200, body: data };
  } catch (error) {
    logger.error(`Error getting domains - ${error}`);
    return { status: 500, body: { details: error } };
  }
};
