import { CronConfig, Handlers } from "motia";

export const config: CronConfig = {
  name: "VerifyDomainNameserversCron",
  type: "cron",
  description: "Endpoint to verify domain nameserver",
  flows: ["DomainManagement"],
  emits: ["domain.verifynameservers"],
  cron: "*/10 * * * *",
};

export const handler: Handlers["VerifyDomainNameserversCron"] = async ({
  logger,
  emit,
}) => {
  try {
    await emit({
      topic: "domain.verifynameservers",
      data: {},
    });
  } catch (error) {
    logger.error(`Error verifying domain nameservers - ${error}`);
    return {
      status: 500,
      body: {
        error: "Failed to verify domain nameservers",
        details: error,
      },
    };
  }
};
