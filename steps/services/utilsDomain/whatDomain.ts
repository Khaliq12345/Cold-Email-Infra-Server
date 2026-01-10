import axios from "axios";

export const WhatDomainsInstance = () => {
  return axios.create({
    baseURL: "https://what.domains",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://dnschecker.org",
      priority: "u=1, i",
      referer: "https://dnschecker.org/",
      "sec-ch-ua": '"Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-fetch-storage-access": "none",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    },
  });
};

export const queryDomain = async (domain: string, logger: any) => {
  try {
    if (logger) logger.info(`Querying domain: ${domain}`);

    const instance = WhatDomainsInstance();
    const response = await instance.get(`/_api?query=${domain}`);

    if (logger) logger.info("Domain query successful");
    return response.data.result.results;
  } catch (error) {
    if (logger) logger.error("Error querying domain:", error);
    throw error;
  }
};

export const queryDomainStatus = async (domain: string, logger?: any) => {
  try {
    if (logger) logger.info(`Querying domain status: ${domain}`);

    const instance = WhatDomainsInstance();
    const response = await instance.get(`/_api/status?query=${domain}`);

    if (logger) logger.info("Domain status query successful");
    return response.data.result;
  } catch (error) {
    if (logger) logger.error("Error querying domain status:", error);
    throw error;
  }
};
