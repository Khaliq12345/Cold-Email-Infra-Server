import { ApiRouteConfig, Handlers } from "motia";
import { instance } from "../../services/server/server";

export const config: ApiRouteConfig = {
  type: "api",
  name: "GetSSHKeys",
  path: "/servers/ssh_keys",
  method: "GET",
  flows: ["ServerManagement"],
  emits: [],
};

export const handler: Handlers["GetSSHKeys"] = async (req, { logger }) => {
  logger.info("GETTING SSH KEYS");
  const response = await instance.get("https://api.hetzner.cloud/v1/ssh_keys");

  return { status: 200, body: response.data };
};
