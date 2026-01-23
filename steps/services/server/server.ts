import axios from "axios";

export const instance = axios.create({
  baseURL: "https://api.hetzner.cloud",
  headers: {
    Authorization: `Bearer ${process.env.HERTZNER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

enum StatusStatus {
  running = "running",
  pending = "pending",
  deleted = "deleted",
  stopped = "stopped",
}
export const serverStatus = StatusStatus;
