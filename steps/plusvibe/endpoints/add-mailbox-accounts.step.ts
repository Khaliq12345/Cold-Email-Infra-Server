import { ApiRouteConfig, Handlers } from "motia";

export const config: ApiRouteConfig = {
  name: "AddMailboxAccounts",
  type: "api",
  description: "Endpoint to call to add mailbox account to plusvibe",
  flows: ["PlusvibeManagement"],
  emits: ["plusvibe.add.mailboxes"],
  path: "/plusvibe/mailboxes/:domain",
  method: "POST",
};

export const handler: Handlers["AddMailboxAccounts"] = async (
  req,
  { emit, logger },
) => {
  try {
    const { domain } = req.pathParams;
    await emit({
      topic: "plusvibe.add.mailboxes",
      data: {
        domain: domain,
      },
    });

    return { status: 200, body: "MAILBOXES ACCOUNT ADDITION REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error adding mailbox accounts to plusvibe - ${error}`);
    return {
      status: 500,
      body: "MAILBOXES ACCOUNT ADDITION REQUESTS NOT SENT",
    };
  }
};
