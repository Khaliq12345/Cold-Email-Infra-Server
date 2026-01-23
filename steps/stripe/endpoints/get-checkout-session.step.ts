import { ApiRouteConfig, Handlers } from "motia";
import { GetCheckout } from "../../services/stripe/stripe";
import { supabase } from "../../services/supabase/supabase";

export const config: ApiRouteConfig = {
  name: "GetCheckoutSession",
  type: "api",
  description: "Endpoint to retrieve checkout session",
  flows: ["StripeManagement"],
  emits: [],
  path: "/stripe/checkout/session/:checkoutId",
  method: "GET",
};

export const handler: Handlers["GetCheckoutSession"] = async (
  req,
  { logger },
) => {
  try {
    const { checkoutId } = req.pathParams;

    logger.info(`Retrieving the checkout session for - ${checkoutId}`);
    const response = await GetCheckout(checkoutId);
    if (response.metadata) {
      const domain = response.metadata.domain;
      const username = response.metadata.username;

      logger.info("Validating checkout");
      const { error } = await supabase.from("domains").insert({
        username: username,
        domain: domain,
      });

      if (error) {
        logger.error("Error creating the domain and username");
        return {
          status: 500,
          body: {
            isValid: false,
          },
        };
      }

      logger.info("Checkout is valid");
      return {
        status: 200,
        body: {
          isValid: true,
        },
      };
    } else {
      return {
        status: 403,
        body: {
          isValid: false,
        },
      };
    }
  } catch (error: any) {
    logger.error(`Error Retrieving the checkout session - ${error.message}`);

    return {
      status: 500,
      body: {
        isValid: false,
      },
    };
  }
};
