import { EventConfig, Handlers } from "motia";
import { addWorkspace } from "../../services/plusvibe/plusvibe";
import { supabase } from "../../services/supabase/supabase";

export const config: EventConfig = {
  name: "CreateWorkspaceJob",
  type: "event",
  description: "Background job to create a new workspace in PlusVibe",
  flows: ["PlusvibeManagement"],
  emits: [],
  subscribes: ["plusvibe.workspace.create"],
};

export const handler: Handlers["CreateWorkspaceJob"] = async (
  input,
  { logger },
) => {
  // Input comes from the event payload
  const { workspace_name, domain } = input;

  // Optional: You could also use the env var as a fallback for the reference ID
  const referenceId = process.env.WORKSPACE_ID;

  if (!workspace_name) {
    logger.error("Job failed: workspace_name is missing from event input");
    return;
  }
  if (!referenceId) {
    logger.error("Job failed: workspace_id is missing");
    return;
  }

  logger.info(`Processing workspace creation for: ${workspace_name}`);

  try {
    // 1. Call the service to add workspace
    const result = await addWorkspace(referenceId, workspace_name, logger);

    logger.info(`Workspace created successfully. New ID: ${result._id}`);

    await supabase
      .from("domains")
      .update({
        plusvibe_workspace: result._id,
      })
      .eq("domain", domain);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    logger.error(`Error in CreateWorkspaceJob: ${errorMessage}`);
    throw error;
  }
};
