import { ApiRouteConfig, Handlers } from "motia";
import { serverStatus, instance } from "../../services/server/server";
import { supabase } from "../../services/supabase/supabase";

const cloudConfig = `#cloud-config\npackages:\n  - git\n  - openssl\n  - curl\n  - gawk\n  - coreutils\n  - grep\n  - apt-transport-https\n  - ca-certificates\n  - gnupg\n  - lsb-release\n  - jq\n  \npackage_update: true\npackage_upgrade: true\n\nruncmd:\n  # 2. Install Docker\n  - curl -fsSL https://get.docker.com -o get-docker.sh\n  - sudo sh get-docker.sh\n\n\n  # 4. Mailcow Installation\n  - cd /opt\n  - git clone https://github.com/mailcow/mailcow-dockerized\n  - cd mailcow-dockerized\n  - export MAILCOW_HOSTNAME="mail.examp.com"\n  - export MAILCOW_TZ="Europe/Berlin"\n  - export MAILCOW_BRANCH=1\n  - printf "" | ./generate_config.sh\n  - sudo docker compose pull\n  - sudo docker compose up -d\n  \n  # 5. Finalize\n  - reboot`;

const plans = {
  plan1: {
    name: "server-1",
    location: "hil",
    image: "ubuntu-24.04",
    server_type: "ccx23",
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
  logger.info(`${username} | ${plan} | ${domain}`);

  const planData = plans[plan];
  const serverName = `${username}-${plan}-${planData.location}`;

  // Verify that the server is not created
  const { data: initialData } = await supabase
    .from("servers")
    .select("server_name")
    .eq("server_name", serverName);

  if (initialData && initialData.length > 0) {
    return;
  }

  // Send the requests to create the server
  try {
    const response1 = await instance.get(`/v1/servers?name=${serverName}`);
    const servers = response1.data.servers;
    if (servers.length > 0) {
      const server = servers[0];
      logger.info("SERVER IS ALREADY CREATED");
      const server_id = server.id;
      // Add server to the database
      await supabase.from("servers").insert({
        server_name: serverName,
        domain: domain,
        status: serverStatus.pending,
        server_id: server_id,
      });
      logger.info("SERVER ADDED TO DB");
      return;
    }
    logger.info(`CREATING THE SERVER - ${planData}`);
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

    // Add server to the database
    const { error: error1 } = await supabase.from("servers").insert({
      server_name: serverName,
      domain: domain,
      status: serverStatus.pending,
      server_id: server_id,
    });
    logger.info("SERVER ADDED TO DB");
    if (error1) {
      throw Error("Unable to insert into the database");
    }
    logger.info("SERVER CREATED!");
  } catch (error) {
    logger.error(`Error Creating the server - ${error}`);
  }
};
