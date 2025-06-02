/// <reference types="node" />
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env.local

import { Job, Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { redisConnection, WORKFLOW_QUEUE_NAME } from '@/lib/queue';
import { availableAgents } from '@/lib/agents';
import { createBackendClient } from '@pipedream/sdk/server';

const { DeepResearchMarketingAgent } = require('./worker/deepResearchMarketingAgent/agent.js');
const { HackerNewsAgent } = require('./worker/hackerNewsAgent/agent.js');

console.log(`🚀 Worker for queue [${WORKFLOW_QUEUE_NAME}] starting...`);

// --- Pipedream SDK Client Initialization for Worker ---
let pdWorkerClient: ReturnType<typeof createBackendClient> | null = null;

const pdEnvironment = process.env.PIPEDREAM_ENVIRONMENT;
const pdClientId = process.env.PIPEDREAM_CLIENT_ID;
const pdClientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
const pdProjectId = process.env.PIPEDREAM_PROJECT_ID;

if (pdEnvironment && pdClientId && pdClientSecret && pdProjectId) {
  try {
    pdWorkerClient = createBackendClient({
      environment: pdEnvironment as 'development' | 'production',
      credentials: {
        clientId: pdClientId,
        clientSecret: pdClientSecret,
      },
      projectId: pdProjectId,
    });
    console.log(`[Worker] SDK Client initialized for Project ID: ${pdProjectId}`);
  } catch (error) {
    console.error('WORKER_ERROR: Failed to initialize SDK client:', error);
  }
} else {
  console.error('WORKER_ERROR: Pipedream ENV vars not set for worker.');
}

// --- Helper: JS Agent Executor (Example) ---
async function executeJsAgent(agentId: string, agentInput: any): Promise<any> {
    console.log(`[Worker] Executing JS agent: ${agentId} with input:`, agentInput);
    const agentDefinition = availableAgents.find(a => a.id === agentId);
    if (!agentDefinition) throw new Error(`Agent definition for ${agentId} not found.`);

    if (agentId === "deep-research-marketing-agent") {
        console.log(`[Worker] Preparing to execute DeepResearchMarketingAgent.`);
        if (!agentInput) { // Should be validated before job creation ideally, but good to check
            throw new Error('Agent input is missing for deep-research-marketing-agent');
        }
        const agent = new DeepResearchMarketingAgent(); // Constructor logs API key status
        // The agentInput should match the structure expected by createSocialMediaPost
        // { userQuery, targetAudience, toneStyle, keyMessageAngle, callToAction, useCitations, perplexityMaxOutputTokens }
        return await agent.createSocialMediaPost(agentInput);
    } else if (agentId === "hacker-news-summary-agent") {
        console.log(`[Worker] Preparing to execute HackerNewsAgent.`);
        // agentInput from Groundwork will be passed as the configuration to the HackerNewsAgent constructor.
        // If agentInput is null or undefined, an empty object should be passed to use default agent config.
        const agentConfig = agentInput || {};
        const agent = new HackerNewsAgent(agentConfig);
        try {
            const result = await agent.run();
            // The agent's run() method returns a report object.
            // This object will be the output of the executeJsAgent function.
            return result;
        } catch (error: any) {
            console.error(`[Worker] Error executing HackerNewsAgent: ${error.message}`, error);
            throw new Error(`HackerNewsAgent execution failed: ${error.message}`);
        }
    }
    // Add more agent logic
    throw new Error(`Execution logic for agent ${agentId} not implemented.`);
}

async function sendToPipedreamApp(
    pipedreamAppSlug: string,
    pipedreamConnectedAccountId: string,
    userId: string,
    data: any,
    outputConfiguration: any
): Promise<{ success: boolean; message: string; responseData?: any }> {
    if (!pdWorkerClient) {
        const errorMsg = '[Worker] Pipedream SDK client not initialized.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    console.log(`[Worker] Sending to Pipedream app ${pipedreamAppSlug}`);
    let requestDetails: {
        method: 'POST' | 'GET' | 'PUT' | 'DELETE';
        url: string; // This will be the Pipedream component path, e.g., /actions/slack_post_message
        body?: any;
        headers?: Record<string, string>;
    } | null = null;

    const commonHeaders = { 'Content-Type': 'application/json' };

    if (pipedreamAppSlug === 'google_sheets') {
        console.log('[Worker] Received outputConfiguration for google_sheets:', JSON.stringify(outputConfiguration, null, 2));
        if (outputConfiguration?.action === 'appendRow' && outputConfiguration?.spreadsheetId && outputConfiguration?.sheetName) {
            requestDetails = {
                method: 'POST',
                url: `https://sheets.googleapis.com/v4/spreadsheets/${outputConfiguration.spreadsheetId}/values/${outputConfiguration.sheetName}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
                body: {
                    values: [Object.values(data)], // Agent output converted to an array of values for a row
                },
                headers: commonHeaders
            };
        } else if (outputConfiguration?.action === 'createSheetAndAppendRow' && outputConfiguration?.newSpreadsheetName) {
            // Simplified to just create the spreadsheet for now.
            // Appending would ideally be a subsequent step or a combined Pipedream workflow.
            requestDetails = {
                method: 'POST',
                url: 'https://sheets.googleapis.com/v4/spreadsheets',
                body: {
                    properties: {
                        title: outputConfiguration.newSpreadsheetName
                    },
                    sheets: [{
                        properties: {
                            title: outputConfiguration.worksheetName || 'Sheet1'
                        }
                    }]
                },
                headers: commonHeaders
            };
        }
    } else if (pipedreamAppSlug === 'slack') {
        const { channelId } = outputConfiguration;
        const markdownReport = data; // Assuming data is the already formatted and escaped markdown string

        // Log the exact markdown report content before sending - useful for debugging
        // console.log("[Worker] Attempting to send to Slack. Markdown Report Content (for top-level text):\n", JSON.stringify(markdownReport, null, 2));

        requestDetails = {
            method: 'POST',
            url: 'https://slack.com/api/chat.postMessage', // Using direct Slack API endpoint
            body: {
                channel: channelId,
                text: markdownReport, // Send the full markdown report in the top-level text field
                mrkdwn: true // Explicitly enable markdown processing for the text field
            },
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        };
    }

    if (!requestDetails) {
        const errorMsg = `[Worker] Output config for ${pipedreamAppSlug} not supported.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    console.log('[Worker] Pipedream proxy request:', requestDetails.url, 'Body:', requestDetails.body);
    try {
        // Assuming makeProxyRequest returns an object that might have status, data, or error properties
        // This is a common pattern if it doesn't conform to Fetch API directly.
        const response: any = await pdWorkerClient.makeProxyRequest(
            { searchParams: { account_id: pipedreamConnectedAccountId, external_user_id: userId } },
            { url: requestDetails.url, options: { method: requestDetails.method, headers: requestDetails.headers, body: requestDetails.body ? JSON.stringify(requestDetails.body) : undefined } }
        );

        // Check for a successful response - this part is speculative based on common SDK patterns
        // You might need to adjust this based on actual Pipedream SDK behavior for makeProxyRequest
        if (response && (response.status === 200 || response.success || response.ok === true || (typeof response.ok === 'undefined' && !response.error) ) ) {
            const responseData = response.data || response.body || response; // Try common places for data
            console.log('[Worker] Pipedream proxy success. Response:', responseData);
            return { success: true, message: "Data sent via Pipedream proxy.", responseData };
        } else {
            const errorBody = response.error || response.message || JSON.stringify(response); // Try common places for error
            const statusCode = response.status || 'Unknown';
            const errorMsg = `[Worker] Pipedream proxy failed (${statusCode}): ${errorBody}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('[Worker] Error in Pipedream proxy call:', error);
        throw error;
    }
}

// Define the expected structure of job.data for clarity
interface WorkflowJobData {
    workflowRunId: string;
    agentId: string;
    agentInput: any;
    outputPipedreamAppSlug?: string;
    outputPipedreamConnectedAccountId?: string;
    outputConfiguration?: any;
    userId: string; // Essential for Pipedream proxy calls
}

const worker = new Worker<WorkflowJobData>(WORKFLOW_QUEUE_NAME, async (job: Job<WorkflowJobData>) => {
  const { workflowRunId, agentId, agentInput, outputPipedreamAppSlug, outputPipedreamConnectedAccountId, outputConfiguration, userId } = job.data;
  console.log(`[${WORKFLOW_QUEUE_NAME}] Processing job ${job.id} for ${workflowRunId}`);
  let logs: string[] = [`Job ${job.id} started at ${new Date().toISOString()}`];

  try {
    await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { status: "processing", startedAt: new Date(), logs: { push: logs[0] } } });
    logs.push(`Executing agent: ${agentId}`);
    await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { logs: { set: logs } } });
    const agentOutput = await executeJsAgent(agentId, agentInput);
    logs.push(`Agent ${agentId} output received.`);
    await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { agentOutput, logs: { set: logs } } });

    if (outputPipedreamAppSlug && outputPipedreamConnectedAccountId && outputConfiguration && userId) {
        logs.push(`Sending output to Pipedream app: ${outputPipedreamAppSlug}`);
        await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { logs: { set: logs } } });
        await sendToPipedreamApp(outputPipedreamAppSlug, outputPipedreamConnectedAccountId, userId, agentOutput, outputConfiguration);
        logs.push(`Successfully sent data to ${outputPipedreamAppSlug}.`);
        await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { logs: { set: logs } } });
    } else {
        logs.push('Skipping Pipedream: Config or userId incomplete.');
        await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { logs: { set: logs } } });
    }
    logs.push(`Workflow run completed successfully.`);
    await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { status: "completed", completedAt: new Date(), logs: { set: logs } } });
    console.log(`[${WORKFLOW_QUEUE_NAME}] Job ${job.id} for ${workflowRunId} completed.`);

  } catch (error: any) {
    console.error(`[${WORKFLOW_QUEUE_NAME}] Job ${job.id} FAILED for ${workflowRunId}:`, error.message, error.stack);
    logs.push(`Error: ${error.message}`);
    await prisma.workflowRun.update({ where: { id: workflowRunId }, data: { status: "failed", errorMessage: error.message, completedAt: new Date(), logs: { set: logs } } });
    throw error;
  }
}, { connection: redisConnection, concurrency: 5 });

worker.on('completed', (job: Job<WorkflowJobData>, result: any) => {
  console.log(`[${WORKFLOW_QUEUE_NAME}] Job ${job.id} completed.`, result);
});

worker.on('failed', (job: Job<WorkflowJobData> | undefined, err: Error) => {
  console.error(`[${WORKFLOW_QUEUE_NAME}] Job ${job?.id || 'unknown'} failed:`, err.message);
});

worker.on('error', (err: Error) => {
  // Generic worker errors (e.g., connection issues)
  console.error(`[${WORKFLOW_QUEUE_NAME}] Worker error:`, err.message, err.stack);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);
    try {
        await worker.close();
        await redisConnection.quit(); // Or .disconnect() if .quit() gives issues
        console.log("Worker/Redis closed.");
    } catch (err) {
        console.error("Error during shutdown:", err);
    }
    process.exit(0);
};
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker stop, K8s pod termination