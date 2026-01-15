import { ApiRouteConfig, Handlers } from "motia";
import { listSmtpAccounts } from "../../services/plusvibe/plusvibe";
import { getPlusvibeWorkspace } from "../../services/supabase/supabase";

export const config: ApiRouteConfig = {
  name: "ListMailboxAccounts",
  type: "api",
  description: "Endpoint to list all email accounts for a specific workspace",
  flows: ["PlusvibeManagement"],
  emits: [],
  path: "/plusvibe/mailboxes/:domain",
  method: "GET",
};

export const handler: Handlers["ListMailboxAccounts"] = async (
  req,
  { logger },
) => {
  try {
    const { domain } = req.pathParams;

    const workspaceId = await getPlusvibeWorkspace(domain);
    // Extract optional query parameters from the request
    const { skip, limit, email } = req.queryParams;
    logger.info(`${limit} ${email} ${skip}`);

    logger.info(
      `API Request: Listing mailbox accounts for workspace ${workspaceId}`,
    );

    const result = await listSmtpAccounts(
      workspaceId,
      {
        skip: skip ? Number(skip) : undefined,
        limit: limit ? Number(limit) : undefined,
        email: email as string,
      },
      logger,
    );

    return {
      status: 200,
      body: {
        message: "SUCCESS",
        data: result.accounts,
      },
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    return {
      status: 500,
      body: {
        message: "ERROR_FETCHING_ACCOUNTS",
        error: errorMessage,
      },
    };
  }
};
