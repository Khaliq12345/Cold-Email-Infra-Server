import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { z } from "zod";

const schema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  email: z.pipe(z.string(), z.email()),
  password: z.string(),
});

export const config: ApiRouteConfig = {
  name: "Signup",
  type: "api",
  description: "Endpoint to call for sign ups",
  flows: ["AuthManagement"],
  emits: [],
  path: "/auth/signup",
  method: "POST",
  bodySchema: schema,
};

export const handler: Handlers["Signup"] = async (req, { emit, logger }) => {
  try {
    let body;
    try {
      body = schema.parse(req.body);
    } catch (error) {
      logger.info(`Invalid input - ${error}`);
      return {
        status: 403,
        body: { message: "Error creating new user", error: error },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });
    if (error) {
      return {
        status: 500,
        body: { message: "Error creating new user", error: error },
      };
    }
    const { error: error_data } = await supabase.from("users").upsert({
      email: body.email,
      firstname: body.firstname,
      lastname: body.lastname,
    });
    if (error_data) {
      return {
        status: 500,
        body: { message: "Error creating new user", error: error_data },
      };
    }

    return { status: 200, body: "USER CREATED" };
  } catch (error) {
    logger.error(`Error creating new user - ${error}`);
    return {
      status: 500,
      body: { message: "Error creating new user", error: error },
    };
  }
};
