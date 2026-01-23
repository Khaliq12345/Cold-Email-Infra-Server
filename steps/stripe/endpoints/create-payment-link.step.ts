import { ApiRouteConfig, Handlers } from "motia";
import { GetPaymentLink } from "../../services/stripe/stripe";
import { z } from "zod";

const schema = z.object({
  domain: z.string(),
  username: z.string(),
});

export const config: ApiRouteConfig = {
  name: "CreatePaymentLink",
  type: "api",
  description: "Endpoint to trigger payment link creation",
  flows: ["StripeManagement"],
  emits: [],
  path: "/stripe/create/payment-link",
  method: "POST",
  bodySchema: schema,
};

export const handler: Handlers["CreatePaymentLink"] = async (
  req,
  { logger },
) => {
  try {
    let reqInfo;
    try {
      reqInfo = schema.parse(req.body);
    } catch (error) {
      logger.error(`Error in CreatePaymentLink API: ${error}`);
      return {
        status: 400,
        body: {
          message: "VALIDATION ERROR",
          error: error,
        },
      };
    }

    const { domain, username } = reqInfo;

    logger.error(`Creating payment link for domain - ${domain}`);
    const response = await GetPaymentLink(domain, username);

    return {
      status: 200,
      body: {
        url: response.url,
      },
    };
  } catch (error: any) {
    logger.error(`Error creating payment link - ${error.message}`);

    return {
      status: 500,
      body: "FAILED TO CREATE PAYMENT LINK",
    };
  }
};
