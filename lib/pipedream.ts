import { createBackendClient } from "@pipedream/sdk/server";

const projectId = process.env.PIPEDREAM_PROJECT_ID;
const clientId = process.env.PIPEDREAM_CLIENT_ID;
const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;

if (!projectId) {
  throw new Error("PIPEDREAM_PROJECT_ID is not set in environment variables.");
}
if (!clientId) {
  throw new Error("PIPEDREAM_CLIENT_ID is not set in environment variables.");
}
if (!clientSecret) {
  throw new Error("PIPEDREAM_CLIENT_SECRET is not set in environment variables.");
}

const nodeEnv = process.env.NODE_ENV;
const pipedreamEnv = nodeEnv === "production" ? "production" : "development";

const pipedream = createBackendClient({
  projectId,
  credentials: {
    clientId,
    clientSecret,
  },
  environment: pipedreamEnv,
});

export default pipedream; 