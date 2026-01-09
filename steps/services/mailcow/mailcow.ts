import axios from "axios";
import { domainToken } from "../../services/supabase/supabase";

export const MailcowInstance = async (domain: string) => {
  const MAILCOW_API_URL = `https://mail.${domain}/api/v1`;
  const token = await domainToken(domain);
  return axios.create({
    baseURL: MAILCOW_API_URL,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": token,
    },
  });
};

export const extractDKIM = async (domain: string, logger: any) => {
  try {
    logger.info("SENDING THE REQUESTS TO EXTRACT THE DKIM");
    logger.info("SETTING UP THE MAILCOW INSTANCE");
    const instance = await MailcowInstance(domain);
    const response = await instance.get(`/get/dkim/${domain}`);
    logger.info("DKIM Extracted successfully");
    return response.data;
  } catch (error) {
    logger.error("Error Extracting DKIM:", error);
    throw error;
  }
};
