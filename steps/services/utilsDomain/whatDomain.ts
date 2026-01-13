import axios from "axios";

export const NamecheapAPIInstance = () => {
  return axios.create({
    baseURL: "https://domains.revved.com",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      origin: "https://www.namecheap.com",
      priority: "u=1, i",
      referer: "https://www.namecheap.com/",
      "sec-ch-ua": '"Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    },
  });
};

export const SquareSpaceDomainsInstance = () => {
  return axios.create({
    baseURL: "https://domains.squarespace.com",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
      referer: "https://domains.squarespace.com/domain-search",
      "sec-ch-ua": '"Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua-platform-version": '"6.14.0"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      Cookie: "crumb=BbvKiq2DNdjpYWVmNWMzM2FhNDk3NWZhODFhMzVjMWZkNTk2Zjg4",
    },
  });
};

export const queryDomain = async (domain: string, logger: any) => {
  try {
    if (logger) logger.info(`Querying domain: ${domain}`);

    const instance = SquareSpaceDomainsInstance();
    const response = await instance.get(`/api/domain-search?query=${domain}`, {
      maxBodyLength: Infinity,
    });

    if (logger) logger.info("Domain query successful");
    return response.data.defaultSuggestions;
  } catch (error) {
    console.log("ERROR", error);
    if (logger) logger.error(`Error querying domain: ${error}`);
    throw error;
  }
};

export const queryDomainStatus = async (domain: string, logger?: any) => {
  try {
    if (logger) logger.info(`Querying domain status: ${domain}`);
    const instance = NamecheapAPIInstance();
    const response = await instance.get(`/v1/domainStatus?domains=${domain}`);
    if (logger) logger.info("Domain status query successful");
    return response.data.status[0];
  } catch (error) {
    console.log(error);
    if (logger) logger.error("Error querying domain status:", error);
    throw error;
  }
};

export const queryDomainNameservers = async (domain: string, logger?: any) => {
  try {
    if (logger) logger.info(`Querying domain nameservers: ${domain}`);

    const response = await fetch(
      `https://api.ns-lookup.io/v1/dns?domain=${domain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          Origin: "https://www.ns-lookup.io",
          Referer: "https://www.ns-lookup.io/",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
          "sec-ch-ua": '"Chromium";v="143", "Not A(Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Linux"',
        },
      },
    );

    const data = await response.json();

    if (logger) logger.info("Domain nameservers query successful");

    return data.data.zone.parent_nameservers;
  } catch (error) {
    console.log(error);
    if (logger) logger.error("Error querying domain nameservers:", error);
    throw error;
  }
};
