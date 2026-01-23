import { EventConfig, Handlers } from "motia";
import { supabase } from "../../services/supabase/supabase";
import { verifyNameServers } from "../../services/utilsDomain/whatDomain";

export const config: EventConfig = {
  name: "VerifyDomainNameserversJob",
  type: "event",
  description: "Event to call to verify nameservers for all domains",
  flows: ["DomainManagement"],
  emits: [],
  subscribes: ["domain.verifynameservers"],
};

export const handler: Handlers["VerifyDomainNameserversJob"] = async (
  input,
  { logger },
) => {
  // Expected nameservers
  const expectedNameservers = [
    "hydrogen.ns.hetzner.com.",
    "oxygen.ns.hetzner.com.",
    "helium.ns.hetzner.de.",
  ];

  logger.info(`verifying the Domain nameservers for all domains`);
  try {
    // retrieve the domains with unverified nameservers
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .or("nameserver.is.null,nameserver.eq.false");

    if (!data) {
      return;
    }
    // Loop through it all and reverify the nameservers
    for (const domainInfo of data) {
      let isValid = false;
      try {
        isValid = await verifyNameServers(
          expectedNameservers,
          domainInfo.domain,
        );
        // update the database with the new status
        await supabase
          .from("domains")
          .update({ nameserver: isValid })
          .eq("domain", domainInfo.domain);

        logger.info(`Domain nameserver - ${domainInfo.domain} updated`);
      } catch (error) {
        console.log(error);
        logger.error("Error - ", error);
      }
    }
  } catch (error) {
    logger.error(`Error getting domains - ${error}`);
  }
};
