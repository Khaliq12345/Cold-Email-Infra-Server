import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";

export const config: ApiRouteConfig = {
  type: "api",
  name: "GetServerStatus",
  path: "/servers/status/:name",
  method: "GET",
  flows: ["ServerManagement"],
  emits: [],
};

export const handler: Handlers["GetServerStatus"] = async (req, { logger }) => {
  logger.info("GETTING SERVER");

  const { error, data } = await supabase
    .from("servers")
    .select("*")
    .eq("server_name", req.pathParams.name)
    .single();

  if (error) {
    logger.error(`Error fetching the server status`);
    return {
      status: 503,
      body: `Error fetching the server status - ${error}`,
    };
  }

  return { status: 200, body: data };
};
