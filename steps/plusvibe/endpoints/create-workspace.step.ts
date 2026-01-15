import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";

const schema = z.object({
  domain: z.string().min(1, "Domain name is required"),
  workspace_name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters"),
});

export const config: ApiRouteConfig = {
  name: "CreateWorkspace",
  type: "api",
  description: "Endpoint to trigger background workspace creation",
  flows: ["PlusvibeManagement"],
  emits: ["plusvibe.workspace.create"],
  path: "/plusvibe/workspaces",
  method: "POST",
  bodySchema: schema,
};

export const handler: Handlers["CreateWorkspace"] = async (
  req,
  { emit, logger },
) => {
  try {
    let reqInfo;
    try {
      reqInfo = schema.parse(req.body);
    } catch (error) {
      logger.error(`Error in GetMailboxWarmupStats API: ${error}`);
      return {
        status: 400,
        body: {
          message: "VALIDATION ERROR",
          error: error,
        },
      };
    }

    const { domain, workspace_name } = reqInfo;

    // 2. Emit the event for the background worker
    await emit({
      topic: "plusvibe.workspace.create",
      data: {
        domain,
        workspace_name,
      },
    });

    logger.info(`Workspace creation event emitted for: ${workspace_name}`);

    return {
      status: 200,
      body: "WORKSPACE CREATION REQUEST ENQUEUED",
    };
  } catch (error: any) {
    logger.error(`Error emitting workspace creation event - ${error.message}`);

    return {
      status: 500,
      body: "FAILED TO ENQUEUE WORKSPACE CREATION REQUEST",
    };
  }
};
