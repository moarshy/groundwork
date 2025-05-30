import { createBackendClient } from "@pipedream/sdk/server";

// Ensure these environment variables are accessible to the worker process.
// If running the worker separately, you might need to load .env or ensure they are set.
const projectId = process.env.PIPEDREAM_PROJECT_ID;
const clientId = process.env.PIPEDREAM_CLIENT_ID;
const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;

if (!projectId) {
  console.error("WORKER_ERROR: PIPEDREAM_PROJECT_ID is not set.");
  // Depending on desired behavior, you might throw an error or have a fallback.
  // For now, we log and let it potentially fail later if pd is used without being initialized.
}
if (!clientId) {
  console.error("WORKER_ERROR: PIPEDREAM_CLIENT_ID is not set.");
}
if (!clientSecret) {
  console.error("WORKER_ERROR: PIPEDREAM_CLIENT_SECRET is not set.");
}

const nodeEnv = process.env.NODE_ENV || "development";
const pipedreamEnv = nodeEnv === "production" ? "production" : "development";

// Initialize Pipedream client specifically for the worker
// It's important that this client is configured correctly for the worker's environment.
const pipedream = projectId && clientId && clientSecret ? createBackendClient({
  projectId,
  credentials: {
    clientId,
    clientSecret,
  },
  environment: pipedreamEnv,
}) : null;

if (!pipedream) {
    console.error("WORKER_ERROR: Pipedream SDK client could not be initialized in worker. Check ENV variables.")
}

interface PipedreamApiRequestWorkerParams {
  accountId: string;         // Pipedream connected account ID
  externalUserId: string;    // Your application's user ID, linked to Pipedream
  endpoint: string;          // Base API endpoint (e.g., https://sheets.googleapis.com/v4/spreadsheets)
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: Record<string, any>; // For POST/PUT body
  queryParams?: Record<string, string | number | boolean>; // For URL query parameters
}

export async function makePipedreamApiRequestForWorker({
  accountId,
  externalUserId,
  endpoint,
  method = "GET",
  data,
  queryParams,
}: PipedreamApiRequestWorkerParams) {
  if (!pipedream) {
    throw new Error("Pipedream SDK client is not initialized in worker. Cannot make API requests.");
  }

  let urlWithParams = endpoint;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams();
    for (const key in queryParams) {
      params.append(key, String(queryParams[key]));
    }
    urlWithParams = `${endpoint}?${params.toString()}`;
  }

  console.log(`[WorkerPipedreamHelper] Making ${method} request to: ${urlWithParams} for account ${accountId} (user: ${externalUserId})`);
  try {
    const proxyResponse: any = await pipedream.makeProxyRequest(
      {
        searchParams: { 
          account_id: accountId,
          external_user_id: externalUserId,
        },
      },
      {
        url: urlWithParams, 
        options: { 
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: data ? JSON.stringify(data) : undefined,
        },
      }
    );

    if (proxyResponse && typeof proxyResponse.json === 'function') {
      return await proxyResponse.json();
    } else if (proxyResponse && proxyResponse.data !== undefined) { 
      return proxyResponse.data;
    } else if (typeof proxyResponse === 'string') {
      try {
        return JSON.parse(proxyResponse);
      } catch (e) {
        return proxyResponse; 
      }
    }
    return proxyResponse;

  } catch (error: any) {
    console.error(`[WorkerPipedreamHelper] Failed ${method} request to ${urlWithParams}:`, error.message);
    const errorDetails = error.response?.data || error.response?.body || error.response || error;
    console.error("[WorkerPipedreamHelper] Error details:", errorDetails);
    // Try to get more specific error message from Pipedream proxy if available
    let pdError = error.message;
    if (errorDetails && typeof errorDetails === 'object' && errorDetails.message) {
        pdError = errorDetails.message;
    } else if (typeof errorDetails === 'string') {
        pdError = errorDetails;
    }
    throw new Error(
      `Pipedream API request via worker failed for ${urlWithParams}: ${pdError}`
    );
  }
} 