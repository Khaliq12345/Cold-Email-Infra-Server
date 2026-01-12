import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(1),
  domain: z.string().min(1),
});

export const config: ApiRouteConfig = {
  name: "AddDomain",
  type: "api",
  description: "Endpoint to add new domain",
  flows: ["DomainManagement"],
  path: "/domains/add",
  emits: [],
  method: "POST",
  bodySchema: schema,
  // middleware: [authMiddleware],
};

export const handler: Handlers["AddDomain"] = async (req, { logger }) => {
  try {
    let parsed;

    try {
      parsed = schema.parse(req.body);
    } catch (error) {
      logger.error(`Error adding domain - Invalid Body - ${error}`);
      return {
        status: 403,
        body: {
          error: "Body is not valid",
          details: error,
        },
      };
    }

    logger.info(`Adding new domain: ${parsed.domain}`);

    const { error, data } = await supabase.from("domains").insert({
      domain: parsed.domain,
      username: parsed.username,
    });
    if (error) {
      console.log(error);
      throw Error("Error updating database");
    }

    return {
      status: 200,
      body: {
        success: true,
        details: "domain added",
      },
    };
  } catch (error) {
    logger.error(`Error creating domain - ${error}`);
    return {
      status: 500,
      body: {
        error: "Failed to create domain",
        details: error,
      },
    };
  }
};
