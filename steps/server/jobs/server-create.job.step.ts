import { ApiRouteConfig, Handlers } from "motia";
import { serverStatus, instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

const cloudConfig = `#cloud-config\npackages:\n  - git\n  - openssl\n  - curl\n  - gawk\n  - coreutils\n  - grep\n  - apt-transport-https\n  - ca-certificates\n  - gnupg\n  - lsb-release\n  - jq\n  \npackage_update: true\npackage_upgrade: true\n\nruncmd:\n  # 2. Install Docker\n  - curl -fsSL https://get.docker.com -o get-docker.sh\n  - sudo sh get-docker.sh\n\n\n  # 4. Mailcow Installation\n  - cd /opt\n  - git clone https://github.com/mailcow/mailcow-dockerized\n  - cd mailcow-dockerized\n  - export MAILCOW_HOSTNAME="mail.examp.com"\n  - export MAILCOW_TZ="Europe/Berlin"\n  - export MAILCOW_BRANCH=1\n  - printf "" | ./generate_config.sh\n  - sudo docker compose pull\n  - sudo docker compose up -d\n  \n  # 5. Finalize\n  - reboot`;

const plans = {
  plan1: {
    name: "demo-12345",
    location: "nbg1",
    image: "ubuntu-24.04",
    server_type: "cpx22",
    ssh_keys: ["khaliq-existantly"],
  },
  plan2: {
    name: "",
    location: "nbg1",
    image: "ubuntu-24.04",
    server_type: "cx23",
    ssh_keys: ["khaliq-existantly"],
  },
};

export const config: ApiRouteConfig = {
  name: "CreateServerJob",
  type: "event",
  description: "Background job that create a server",
  flows: ["ServerManagement"],
  subscribes: ["server.create"],
  emits: [],
};

export const handler: Handlers["CreateServerJob"] = async (
  input,
  { emit, logger },
) => {
  const { username, plan, domain } = input;
  logger.info(username, plan, domain);

  const planData = plans[plan];
  const serverName = `${username}-${plan}-${planData.location}`;

  // Verify that server is not yet created
  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .eq("server_name", serverName)
    .maybeSingle();
  if (data) {
    return;
  }

  // Send the requests to create the server
  try {
    // Add server to the database
    const { error: error1 } = await supabase.from("servers").insert({
      server_name: serverName,
      domain: domain,
      status: serverStatus.pending,
      server_id: null,
    });
    if (error1) {
      throw Error("Unable to insert into the database");
    }

    logger.info("CREATING THE SERVER");
    const response = await instance.post("/v1/servers", {
      name: serverName,
      location: planData.location,
      image: planData.image,
      server_type: planData.server_type,
      ssh_keys: planData.ssh_keys,
      user_data: cloudConfig.replace(
        'MAILCOW_HOSTNAME="mail.examp.com"',
        `MAILCOW_HOSTNAME="mail.${domain}"`,
      ),
    });

    const server_id = response.data.server.id;

    // Update the database with the server id
    const { data, error } = await supabase
      .from("servers")
      .update({
        server_name: serverName,
        domain: domain,
        status: serverStatus.pending,
        server_id: server_id,
      })
      .eq("server_name", serverName);

    if (error) {
      logger.error(`Unable to save the server into the database - ${error}`);
    }
    logger.info("SERVER CREATED!");
  } catch (error) {
    logger.error(`Error Creating the server - ${error}`);
  }
};
