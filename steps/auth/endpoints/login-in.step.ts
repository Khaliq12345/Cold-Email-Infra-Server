import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { z } from "zod";

const schema = z.object({
  email: z.pipe(z.string(), z.email()),
  password: z.string(),
});

export const config: ApiRouteConfig = {
  name: "Login",
  type: "api",
  description: "Endpoint to call for logins",
  flows: ["AuthManagement"],
  emits: [],
  path: "/auth/login",
  method: "POST",
  bodySchema: schema,
};

export const handler: Handlers["Login"] = async (req, { emit, logger }) => {
  try {
    let body;
    try {
      body = schema.parse(req.body);
    } catch (error) {
      logger.info(`Invalid input - ${error}`);
      return {
        status: 403,
        body: { message: "Error Logging into your account", error: error },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) {
      return {
        status: 500,
        body: { message: "Error Logging into your account", error: error },
      };
    }

    return { status: 200, body: data.session };
  } catch (error) {
    logger.error(`Error Logging into your account- ${error}`);
    return {
      status: 500,
      body: { message: "Error Logging into your account", error: error },
    };
  }
};
