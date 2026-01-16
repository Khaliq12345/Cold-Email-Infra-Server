import { ApiRouteConfig, Handlers } from "motia";
import { getAccountWarmupStats } from "../../services/plusvibe/plusvibe";
import { z } from "zod";
import { getPlusvibeWorkspace } from "../../services/supabase/supabase";

const schema = z.object({
  domain: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  email_acc_id: z.string().min(1),
});

export const config: ApiRouteConfig = {
  name: "GetMailboxWarmupStats",
  type: "api",
  description:
    "Get warmup metrics (inbox, spam, promotion) for a specific account",
  flows: ["PlusvibeManagement"],
  emits: [],
  path: "/plusvibe/warmup/stats",
  method: "GET",
};

export const handler: Handlers["GetMailboxWarmupStats"] = async (
  req,
  { logger },
) => {
  try {
    let reqInfo;
    try {
      reqInfo = schema.parse(req.queryParams);
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

    const workspaceId = await getPlusvibeWorkspace(reqInfo.domain);
    if (!workspaceId) {
      return {
        status: 500,
        body: {
          message: "NO WORKSPACE ID",
        },
      };
    }

    logger.info(
      `API Request: Warmup stats for ${reqInfo?.email_acc_id} from ${reqInfo?.start_date} to ${reqInfo?.end_date}`,
    );

    const stats = await getAccountWarmupStats(
      workspaceId as string,
      reqInfo.email_acc_id,
      reqInfo.start_date,
      reqInfo.end_date,
      logger,
    );

    return {
      status: 200,
      body: {
        message: "SUCCESS",
        data: stats,
      },
    };
  } catch (error) {
    logger.error(`Error in GetWarmupStats API: ${error}`);

    return {
      status: 500,
      body: {
        message: "ERROR_FETCHING_WARMUP_STATS",
        error: error,
      },
    };
  }
};
