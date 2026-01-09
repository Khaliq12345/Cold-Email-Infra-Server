import { ApiRouteConfig, Handlers } from "motia";
import z from "zod";

const createServerSchema = z.object({
  domain: z.string(),
  ipaddress: z.string(),
});

export const config: ApiRouteConfig = {
  name: "SetupDNS",
  type: "api",
  path: "/servers/dns",
  method: "POST",
  flows: ["ServerManagement"],
  emits: ["dns.basic.create"],
  bodySchema: createServerSchema,
};

export const handler: Handlers["SetupDNS"] = async (req, { emit, logger }) => {
  let inputData;
  try {
    inputData = createServerSchema.parse(req.body);
  } catch (error) {
    console.log(`INVALID INPUT - ${error}`);
    return { status: 401, message: "Input is not valid" };
  }

  if (emit && inputData) {
    await emit({
      topic: "dns.basic.create",
      data: {
        domain: inputData.domain,
        ipaddress: inputData.ipaddress,
      },
    });
  }

  return { status: 201, body: inputData };
};
