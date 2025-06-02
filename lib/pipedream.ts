import { createBackendClient } from "@pipedream/sdk/server";

const projectId = process.env.PIPEDREAM_PROJECT_ID;
const clientId = process.env.PIPEDREAM_CLIENT_ID;
const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;

// Better build-time detection
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build' || 
                   (typeof window === 'undefined' && !projectId && !clientId);

// Only create client if not building and we have the required environment variables
let pipedream: any = null;

if (!isBuilding && projectId && clientId && clientSecret) {
  const nodeEnv = process.env.NODE_ENV;
  // Allow override of Pipedream environment via environment variable
  const envOverride = process.env.PIPEDREAM_ENVIRONMENT;
  const pipedreamEnv = (envOverride === "development" || envOverride === "production") 
    ? envOverride 
    : (nodeEnv === "production" ? "production" : "development");

  pipedream = createBackendClient({
    projectId,
    credentials: {
      clientId,
      clientSecret,
    },
    environment: pipedreamEnv,
  });
} else if (!isBuilding) {
  // Runtime but missing environment variables
  console.warn("Pipedream environment variables not properly configured. Some features may not work.");
  pipedream = {
    getAccounts: () => {
      console.error("PIPEDREAM_PROJECT_ID, PIPEDREAM_CLIENT_ID, or PIPEDREAM_CLIENT_SECRET is not set in environment variables.");
      return Promise.resolve({ data: [] });
    },
    createConnectToken: () => {
      console.error("PIPEDREAM_PROJECT_ID, PIPEDREAM_CLIENT_ID, or PIPEDREAM_CLIENT_SECRET is not set in environment variables.");
      return Promise.resolve({ connect_link_url: '' });
    },
    deleteExternalUser: () => {
      console.error("PIPEDREAM_PROJECT_ID, PIPEDREAM_CLIENT_ID, or PIPEDREAM_CLIENT_SECRET is not set in environment variables.");
      return Promise.resolve({});
    },
  };
} else {
  // During build time, create a mock client to prevent errors
  pipedream = {
    getAccounts: () => Promise.resolve({ data: [] }),
    createConnectToken: () => Promise.resolve({ connect_link_url: '' }),
    deleteExternalUser: () => Promise.resolve({}),
  };
}

export default pipedream; 