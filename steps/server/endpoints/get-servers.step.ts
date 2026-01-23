import { ApiRouteConfig, Handlers } from "motia";
import { instance } from "../../services/server/server";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const config: ApiRouteConfig = {
  type: "api",
  name: "GetServers",
  path: "/servers",
  method: "GET",
  flows: ["ServerManagement"],
  emits: [],
  // middleware: [authMiddleware],
};

export const handler: Handlers["GetServers"] = async (req, { logger }) => {
  logger.info("GETTING SERVERS");
  const response = await instance.get("https://api.hetzner.cloud/v1/servers");

  return { status: 200, body: response.data };
};
