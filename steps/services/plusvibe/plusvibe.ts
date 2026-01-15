import axios, { AxiosInstance } from "axios";

export const PlusVibeAPIInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: "https://api.plusvibe.ai/api/v1",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.PLUSVIBE_API_KEY || "",
    },
  });

  return instance;
};

export const bulkAddSmtpAccounts = async (
  workspaceId: string,
  accounts: Array<{
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
    imap_host: string;
    imap_port: number;
    smtp_host: string;
    smtp_username: string;
    smtp_password: string;
    smtp_port: number;
  }>,
  logger?: any,
): Promise<{ status: string }> => {
  try {
    if (logger)
      logger.info(
        `Bulk adding ${accounts.length} SMTP accounts to workspace: ${workspaceId}`,
      );

    const instance = PlusVibeAPIInstance();

    // Map the accounts to include the hardcoded Ramp-Up and Warmup logic
    const formattedAccounts = accounts.map((account) => ({
      ...account,
      // Campaign Settings
      daily_limit: 3,
      min_interval: 20, // Recommended default interval
      enable_camp_rampup: "yes",
      camp_rampup_start: 1,
      camp_rampup_increment: 1,

      // Warmup Settings
      enable_warmup: "yes",
      warmup_daily_limit: 3, // Based on your daily limit requirement
      enable_warmup_rampup: "yes",
      warmup_rampup_start: 1,
      warmup_rampup_increment: 1,
    }));

    const response = await instance.post("/account/bulk-add-regular-accounts", {
      workspace_id: workspaceId,
      accounts: formattedAccounts,
    });

    if (logger) logger.info("Bulk add SMTP accounts request successful");

    return response.data;
  } catch (error) {
    // Better error logging for debugging API responses
    const errorMessage = error.response?.data?.message || error.message;
    if (logger)
      logger.error(`Error bulk adding SMTP accounts: ${errorMessage}`);

    throw error;
  }
};

export const listSmtpAccounts = async (
  workspaceId: string,
  options: {
    skip?: number;
    limit?: number;
    email?: string;
  } = {},
  logger?: any,
): Promise<{ accounts: Array<any> }> => {
  try {
    if (logger)
      logger.info(
        `Listing SMTP accounts for workspace: ${workspaceId} ${
          options.email ? `filtered by email: ${options.email}` : ""
        }`,
      );

    const instance = PlusVibeAPIInstance();

    const response = await instance.get("/account/list", {
      params: {
        workspace_id: workspaceId,
        skip: options.skip,
        limit: options.limit,
        email: options.email,
      },
    });

    if (logger)
      logger.info(
        `Successfully retrieved ${response.data.accounts?.length || 0} accounts`,
      );

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    if (logger) logger.error(`Error listing SMTP accounts: ${errorMessage}`);

    throw error;
  }
};

export const getAccountWarmupStats = async (
  workspaceId: string,
  emailAccId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
  logger?: any,
): Promise<any> => {
  try {
    if (logger)
      logger.info(
        `Fetching warmup stats for Account ID: ${emailAccId} in Workspace: ${workspaceId}`,
      );

    const instance = PlusVibeAPIInstance();

    const response = await instance.get("/account/warmup-stats", {
      params: {
        workspace_id: workspaceId,
        email_acc_id: emailAccId,
        start_date: startDate,
        end_date: endDate,
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    if (logger) logger.error(`Error fetching warmup stats: ${errorMessage}`);
    throw error;
  }
};

export const addWorkspace = async (
  referenceWorkspaceId: string,
  newWorkspaceName: string,
  logger?: any,
): Promise<{ workspace_id: string; status: string }> => {
  try {
    if (logger) logger.info(`Creating new workspace: ${newWorkspaceName}`);

    const instance = PlusVibeAPIInstance();

    const response = await instance.post("/workspaces/add/", {
      workspace_id: referenceWorkspaceId,
      workspace_name: newWorkspaceName,
    });
    console.log(response);

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    if (logger) logger.error(`PlusVibe Add Workspace Error: ${errorMessage}`);
    throw error;
  }
};
