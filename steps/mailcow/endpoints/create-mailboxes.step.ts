import { ApiRouteConfig, Handlers } from "motia";
import z from "zod";

const schema = z.object({
  domain: z.string(),
  count: z.number(),
});

export const config: ApiRouteConfig = {
  name: "CreateMailboxes",
  type: "api",
  description: "Endpoint to call the create mailboxes",
  flows: ["MailCowManagement"],
  emits: ["create.mailboxes"],
  path: "/mailcow/mailboxes",
  method: "POST",
  bodySchema: schema,
};

export const handler: Handlers["CreateMailboxes"] = async (
  req,
  { emit, logger },
) => {
  try {
    let body;
    try {
      body = schema.parse(req.body);
    } catch (error) {
      return { status: 403, body: "INVALID INPUT" };
    }
    await emit({
      topic: "create.mailboxes",
      data: {
        domain: body.domain,
        count: body.count,
      },
    });

    return { status: 200, body: "MAILBOXES CREATION REQUESTS SENT" };
  } catch (error) {
    logger.error(`Error getting creating mailboxes - ${error}`);
    return { status: 500, body: "MAILBOXES CREATION REQUESTS NOT SENT" };
  }
};
