import { ApiRouteConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const config: ApiRouteConfig = {
  name: "Tester",
  type: "api",
  description: "Endpoint to call for testing",
  flows: ["AuthManagement"],
  emits: [],
  path: "/auth/test-run:token",
  method: "GET",
  middleware: [authMiddleware],
};

export const handler: Handlers["Tester"] = async (req, { emit, logger }) => {
  const token = req.pathParams.token;
  try {
    return { status: 200, body: "TEST SUCCESS" };
  } catch (error) {
    logger.error(`Error Logging into your account- ${error}`);
    return {
      status: 500,
      body: { message: "Error Testing", error: error },
    };
  }
};
