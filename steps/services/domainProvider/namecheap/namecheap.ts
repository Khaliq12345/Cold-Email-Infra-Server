import axios from "axios";
import os from "os";
import process from "process";

// Function to get the server's IP address
const getClientIp = (): string | undefined => {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
};

export const NamecheapInstance = () => {
  return axios.create({
    baseURL: process.env.NAMECHEAP_API_URL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    params: {
      ApiUser: process.env.NAMECHEAP_API_USER,
      ApiKey: process.env.NAMECHEAP_API_KEY,
      UserName: process.env.NAMECHEAP_API_NAME,
      ClientIp: getClientIp(),
    },
  });
};

export interface ContactInfo {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone: string;
  emailAddress: string;
  organizationName?: string;
}

export interface CreateDomainParams {
  domainName: string;
  years: number;
  registrant: ContactInfo;
  admin: ContactInfo;
  tech: ContactInfo;
  auxBilling: ContactInfo;
  addFreeWhoisguard?: boolean;
  wgEnabled?: boolean;
  isPremiumDomain?: boolean;
  premiumPrice?: number;
  eapFee?: number;
}

export const createDomain = async (
  params: NameCheapCreateDomainParams,
  logger?: any,
) => {
  try {
    if (logger) logger.info(`Creating domain: ${params.domainName}`);

    const instance = NamecheapInstance();

    const requestParams = {
      Command: "namecheap.domains.create",
      DomainName: params.domainName,
      Years: params.years,

      // Registrant
      RegistrantFirstName: params.registrant.firstName,
      RegistrantLastName: params.registrant.lastName,
      RegistrantAddress1: params.registrant.address1,
      RegistrantCity: params.registrant.city,
      RegistrantStateProvince: params.registrant.stateProvince,
      RegistrantPostalCode: params.registrant.postalCode,
      RegistrantCountry: params.registrant.country,
      RegistrantPhone: params.registrant.phone,
      RegistrantEmailAddress: params.registrant.emailAddress,
      RegistrantOrganizationName: params.registrant.organizationName,

      // Admin
      AdminFirstName: params.admin.firstName,
      AdminLastName: params.admin.lastName,
      AdminAddress1: params.admin.address1,
      AdminCity: params.admin.city,
      AdminStateProvince: params.admin.stateProvince,
      AdminPostalCode: params.admin.postalCode,
      AdminCountry: params.admin.country,
      AdminPhone: params.admin.phone,
      AdminEmailAddress: params.admin.emailAddress,
      AdminOrganizationName: params.admin.organizationName,

      // Tech
      TechFirstName: params.tech.firstName,
      TechLastName: params.tech.lastName,
      TechAddress1: params.tech.address1,
      TechCity: params.tech.city,
      TechStateProvince: params.tech.stateProvince,
      TechPostalCode: params.tech.postalCode,
      TechCountry: params.tech.country,
      TechPhone: params.tech.phone,
      TechEmailAddress: params.tech.emailAddress,
      TechOrganizationName: params.tech.organizationName,

      // Aux Billing
      AuxBillingFirstName: params.auxBilling.firstName,
      AuxBillingLastName: params.auxBilling.lastName,
      AuxBillingAddress1: params.auxBilling.address1,
      AuxBillingCity: params.auxBilling.city,
      AuxBillingStateProvince: params.auxBilling.stateProvince,
      AuxBillingPostalCode: params.auxBilling.postalCode,
      AuxBillingCountry: params.auxBilling.country,
      AuxBillingPhone: params.auxBilling.phone,
      AuxBillingEmailAddress: params.auxBilling.emailAddress,
      AuxBillingOrganizationName: params.auxBilling.organizationName,

      // Additional options
      AddFreeWhoisguard: params.addFreeWhoisguard ? "yes" : "no",
      WGEnabled: params.wgEnabled ? "yes" : "no",
      GenerateAdminOrderRefId: false,
      IsPremiumDomain: params.isPremiumDomain || false,
      PremiumPrice: params.premiumPrice || 0,
      EapFee: params.eapFee || 0,
    };

    const response = await instance.get("/xml.response", {
      params: requestParams,
    });

    if (logger) logger.info("Domain created successfully");
    return response.data;
  } catch (error) {
    if (logger) logger.error("Error creating domain:", error);
    throw error;
  }
};
