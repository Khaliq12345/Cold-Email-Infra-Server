import { ApiMiddleware } from "motia";
import { supabase } from "../services/supabase/supabase";

export const authMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const authHeader = req.headers.authorization as String;
  console.log(authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      status: 401,
      body: { message: "Missing or invalid authorization header" },
    };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify the token with Supabase
    const { error } = await supabase.auth.getUser(token);

    if (error) {
      return {
        status: 401,
        body: { message: "Invalid or expired token" },
      };
    }
    // Continue to the next middleware or handler
    return next();
  } catch (error) {
    ctx.logger.error(`Auth error - ${error}`);
    return {
      status: 401,
      body: { message: "Authentication failed" },
    };
  }
};
