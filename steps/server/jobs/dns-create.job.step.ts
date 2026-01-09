import { ApiRouteConfig, Handlers } from "motia";
import { instance } from "../server-instance";
import { supabase } from "../../services/supabase/supabase";

export const config: ApiRouteConfig = {
  name: "BasicDnsCreateJob",
  type: "event",
  description: "Background Job to setup basic dns",
  flows: ["ServerManagement"],
  subscribes: ["dns.basic.create"],
  emits: [],
};

export const handler: Handlers["BasicDnsCreateJob"] = async (
  input,
  { logger },
) => {
  const { domain, ipaddress } = input;

  // Send the requests to create the server
  try {
    logger.info(`SETTING UP THE DNS >>>>> ${domain} - ${ipaddress}`);
    const response = await instance.post(
      "/v1/zones",
      JSON.stringify({
        name: domain,
        mode: "primary",
        ttl: 3600,
        rrsets: [
          {
            name: "@",
            type: "A",
            records: [
              {
                value: ipaddress,
              },
            ],
          },
          {
            name: "mail",
            type: "A",
            records: [
              {
                value: ipaddress,
              },
            ],
          },
          {
            name: "@",
            type: "MX",
            records: [
              {
                value: `10 mail.${domain}.`,
              },
            ],
          },
          {
            name: "autodiscover",
            type: "CNAME",
            records: [
              {
                value: `mail.${domain}.`,
              },
            ],
          },
          {
            name: "autoconfig",
            type: "CNAME",
            records: [
              {
                value: `mail.${domain}.`,
              },
            ],
          },
          {
            name: "_autodiscover._tcp",
            type: "SRV",
            records: [
              {
                value: `0 0 443 mail.${domain}.`,
              },
            ],
          },
          {
            name: "@",
            type: "TXT",
            records: [
              {
                value: '"v=spf1 mx a -all"',
              },
            ],
          },
        ],
      }),
    );

    logger.info(response.data.zone.name);

    // Inform the dns database that the basic dns is set
    const { data, error } = await supabase.from("dns").insert({
      domain: domain,
      basic_dns: true,
    });

    if (error) {
      logger.error(`Unable to save the dns info into the database - ${error}`);
    }
    logger.info("BASIC DNS IS SET!");
  } catch (error) {
    logger.error(`Error Setting up the BASIC DNS - ${error}`);
  }
};
