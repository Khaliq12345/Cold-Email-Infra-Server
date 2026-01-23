import { config } from "@motiadev/core";
import endpointPlugin from "@motiadev/plugin-endpoint/plugin";
import logsPlugin from "@motiadev/plugin-logs/plugin";
import observabilityPlugin from "@motiadev/plugin-observability/plugin";
import statesPlugin from "@motiadev/plugin-states/plugin";
import bullmqPlugin from "@motiadev/plugin-bullmq/plugin";

export default config({
  // This allows Docker to tell the app where Redis is
  redis: {
    useMemoryServer: false,
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  // IMPORTANT: Ensure the server binds to 0.0.0.0 inside Docker
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [
    observabilityPlugin,
    statesPlugin,
    endpointPlugin,
    logsPlugin,
    bullmqPlugin,
  ],
});
