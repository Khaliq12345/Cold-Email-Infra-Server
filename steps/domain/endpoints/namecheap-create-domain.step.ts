import { ApiRouteConfig, Handlers } from "motia";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { supabase } from "../../services/supabase/supabase";
import { createDomain } from "../../services/domainProvider/namecheap/namecheap";
import type {
  ContactInfo,
  CreateDomainParams,
} from "../../services/domainProvider/namecheap/namecheap";
import { z } from "zod";

export const ContactInfoSchema: z.ZodType<ContactInfo> = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address1: z.string().min(1),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  phone: z.string().regex(/^\+\d{1,3}\.\d+$/),
  emailAddress: z.email(),
  organizationName: z.string().optional(),
});

export const schema: z.ZodType<CreateDomainParams> = z.object({
  domainName: z.string().min(1),
  years: z.number().int().min(1).max(10),
  registrant: ContactInfoSchema,
  admin: ContactInfoSchema,
  tech: ContactInfoSchema,
  auxBilling: ContactInfoSchema,
  addFreeWhoisguard: z.boolean().optional(),
  wgEnabled: z.boolean().optional(),
  isPremiumDomain: z.boolean().optional(),
  premiumPrice: z.number().nonnegative().optional(),
  eapFee: z.number().nonnegative().optional(),
});

export const config: ApiRouteConfig = {
  name: "NamecheapCreateDomain",
  type: "api",
  description: "Endpoint to create a domain via Namecheap",
  flows: ["DomainManagement"],
  path: "/namecheap/domains/create/:username",
  emits: [],
  method: "POST",
  bodySchema: schema,
  // middleware: [authMiddleware],
};

export const handler: Handlers["NamecheapCreateDomain"] = async (
  req,
  { logger },
) => {
  const { username } = req.pathParams;
  try {
    let domainParams;

    try {
      domainParams = schema.parse(req.body);
    } catch (error) {
      logger.error(`Error creating domain - Invalid Body - ${error}`);
      return {
        status: 403,
        body: {
          error: "Body is not valid",
          details: error,
        },
      };
    }

    logger.info(`Creating domain: ${domainParams.domainName}`);

    // logger.info(
    //   `Checking that domain is available: ${domainParams.domainName}`,
    // );

    // const { error, data } = await supabase.from("domains").insert({
    //   domain: domainParams.domainName,
    //   username: username,
    // });
    // if (error) {
    //   console.log(error);
    //   throw Error("Error updating database");
    // }

    // await createDomain(domainParams, logger);
    const data = { details: "domain created" };

    return {
      status: 200,
      body: {
        success: true,
        data,
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
