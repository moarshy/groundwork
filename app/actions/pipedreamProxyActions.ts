"use server";

import pipedream from "@/lib/pipedream";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface PipedreamApiRequestParams {
  accountId: string;
  externalUserId: string;
  endpoint: string; // Base endpoint, e.g., https://www.googleapis.com/drive/v3/files
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: Record<string, any>; // For POST/PUT body
  queryParams?: Record<string, string | number | boolean>; // For URL query parameters
}

async function makePipedreamApiRequest({
  accountId,
  externalUserId,
  endpoint,
  method = "GET",
  data,
  queryParams,
}: PipedreamApiRequestParams) {
  let urlWithParams = endpoint;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams();
    for (const key in queryParams) {
      params.append(key, String(queryParams[key]));
    }
    urlWithParams = `${endpoint}?${params.toString()}`;
  }

  console.log(`[PipedreamProxy] Making ${method} request to: ${urlWithParams} for account ${accountId}`);
  try {
    const proxyResponse: any = await pipedream.makeProxyRequest(
      {
        searchParams: { // These are for Pipedream's own /proxy endpoint
          account_id: accountId,
          external_user_id: externalUserId,
        },
      },
      {
        url: urlWithParams, // URL for the target API, now includes query params
        options: { // Options for the target API call
          method: method,
          headers: {
            "Content-Type": "application/json",
            // Other headers like Authorization are handled by Pipedream based on account_id
          },
          body: data ? JSON.stringify(data) : undefined,
          // No searchParams field here, as they are now in the URL
        },
      }
    );

    // Handle Pipedream SDK response variability
    if (proxyResponse && typeof proxyResponse.json === 'function') {
      return await proxyResponse.json();
    } else if (proxyResponse && proxyResponse.data !== undefined) { 
      return proxyResponse.data;
    } else if (typeof proxyResponse === 'string') {
      try {
        return JSON.parse(proxyResponse); // If Pipedream returns a JSON string directly
      } catch (e) {
        // Not a JSON string, return as is (might be plain text or empty for 204)
        return proxyResponse; 
      }
    }
    return proxyResponse; // Fallback for other unexpected structures

  } catch (error: any) {
    console.error(`[PipedreamProxy] Failed ${method} request to ${urlWithParams}:`, error.message);
    const errorDetails = error.response?.data || error.response?.body || error.response || error;
    console.error("[PipedreamProxy] Error details:", errorDetails);
    throw new Error(
      `Pipedream API request failed for ${urlWithParams}: ${error.message || "Unknown error"}`
    );
  }
}

export async function listGoogleSpreadsheets(accountId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  const externalUserId = session.user.id;

  const endpoint = "https://www.googleapis.com/drive/v3/files";
  const queryParams = {
    q: 'mimeType="application/vnd.google-apps.spreadsheet"',
    fields: "files(id,name,createdTime,webViewLink)",
    orderBy: "modifiedTime desc",
  };

  const result = await makePipedreamApiRequest({
    accountId,
    externalUserId,
    endpoint,
    method: "GET",
    queryParams,
  });

  if (result && result.files && Array.isArray(result.files)) {
    return result.files as { id: string; name: string; createdTime: string, webViewLink: string }[];
  }
  console.warn("[listGoogleSpreadsheets] No files found or unexpected response format:", result);
  return [];
}

export async function createGoogleSpreadsheet(accountId: string, sheetName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  const externalUserId = session.user.id;

  const endpoint = "https://sheets.googleapis.com/v4/spreadsheets";
  const requestBody = { // Renamed from 'data' to 'requestBody' for clarity
    properties: {
      title: sheetName,
    },
    sheets: [{
      properties: {
        title: "Sheet1"
      }
    }]
  };

  const result = await makePipedreamApiRequest({
    accountId,
    externalUserId,
    endpoint,
    method: "POST",
    data: requestBody, // Pass the body here
  });

  if (result && result.spreadsheetId) {
    return result as { spreadsheetId: string; spreadsheetUrl: string; properties: { title: string } };
  }
  console.error("[createGoogleSpreadsheet] Failed to create or invalid response:", result);
  throw new Error("Failed to create Google Spreadsheet or invalid response.");
}


export async function listSlackChannels(accountId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  const externalUserId = session.user.id;

  const endpoint = "https://slack.com/api/conversations.list";
  const queryParams = {
    types: "public_channel,private_channel",
    limit: 200,
    exclude_archived: true,
  };

  const result = await makePipedreamApiRequest({
    accountId,
    externalUserId,
    endpoint,
    method: "GET",
    queryParams,
  });
  
  if (result && result.ok && result.channels && Array.isArray(result.channels)) {
    return result.channels as { id: string; name: string; is_member?: boolean, is_private?: boolean, is_im?: boolean, is_channel?: boolean, purpose?: { value: string } }[];
  } else if (result && result.ok === false) { // Check for explicit false for result.ok
    console.error("[SlackProxy] Error listing channels:", result.error, result);
    throw new Error(`Failed to list Slack channels: ${result.error || 'Unknown Slack API error'}`);
  }
  console.warn("[listSlackChannels] No channels found or unexpected response format:", result);
  return [];
} 