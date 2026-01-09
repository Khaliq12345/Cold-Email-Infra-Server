import { ApiRouteConfig, Handlers } from "motia";
import z from "zod";

const createServerSchema = z.object({
  plan: z.enum(["plan1", "plan2"]),
  username: z.string(),
  domain: z.string(),
});

export const config: ApiRouteConfig = {
  name: "CreateServer",
  type: "api",
  path: "/servers",
  method: "POST",
  flows: ["ServerManagement"],
  emits: ["server.create"],
  bodySchema: createServerSchema,
};

export const handler: Handlers["CreateServer"] = async (
  req,
  { emit, logger },
) => {
  let plan;
  try {
    plan = createServerSchema.parse(req.body);
  } catch (error) {
    logger.error(`INVALID INPUT - ${error}`);
    return { status: 401, message: "Input is not valid" };
  }

  if (emit && plan) {
    await emit({
      topic: "server.create",
      data: {
        username: plan.username,
        plan: plan.plan,
        domain: plan.domain,
      },
    });
  }

  return { status: 201, body: plan };
};
