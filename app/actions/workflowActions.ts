"use server";

import type { Workflow, Prisma } from "../../lib/generated/prisma"; // Adjusted type import
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Confirmed NextAuth options path
import { revalidatePath } from "next/cache";
import { workflowQueue, WORKFLOW_QUEUE_NAME } from "@/lib/queue"; 
import { availableAgents, Agent } from "@/lib/agents"; 
import { prisma } from "@/lib/prisma"; // Import the singleton prisma instance

// const prisma = new PrismaClient(); // Remove direct instantiation

async function getUserIdFromSession(): Promise<string> {
  const session = await getServerSession(authOptions); 
  if (!session?.user?.id) throw new Error("User not authenticated or ID not in session");
  return session.user.id;
}

// Placeholder for existing actions (getWorkflows, createWorkflow, etc.)
// We will add them later if they are defined in other parts of the documentation
// or if they are needed for the current functionality.

interface EnqueueWorkflowPayload {
  workflowId: string;
  // agentInputOverride?: Record<string, any>; // Option to allow overriding agentInput
}

export async function enqueueWorkflowRun(payload: EnqueueWorkflowPayload) {
  const userId = await getUserIdFromSession();
  const { workflowId } = payload;

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId, userId },
  });

  if (!workflow) {
    throw new Error("Workflow not found or access denied.");
  }

  // Ensure agentInput exists and is an object, or default to empty object
  const agentInputForRun = (typeof workflow.agentInput === 'object' && workflow.agentInput !== null) 
                           ? workflow.agentInput 
                           : {};

  // Create a WorkflowRun record
  const workflowRun = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      userId: userId,
      status: "queued",
      agentInput: agentInputForRun,
      // bullJobId will be set once the job is added
    },
  });

  // Add job to the queue
  const job = await workflowQueue.add(
    `Execute Workflow: ${workflow.name}`, // Job name
    { // Job data
      workflowId: workflow.id,
      workflowRunId: workflowRun.id,
      userId: userId,
      agentId: workflow.agentId, // Assuming agentId is part of Workflow model
      agentInput: agentInputForRun, 
      outputPipedreamAppSlug: workflow.outputPipedreamAppSlug, // Assuming these are part of Workflow
      outputPipedreamConnectedAccountId: workflow.outputPipedreamConnectedAccountId,
      outputConfiguration: workflow.outputConfiguration,
    },
    // Optional: job options
  );

  // Update WorkflowRun with the BullMQ job ID
  await prisma.workflowRun.update({
    where: { id: workflowRun.id },
    data: { bullJobId: String(job.id) }, // Ensure job.id is string
  });

  console.log(`[${WORKFLOW_QUEUE_NAME}] Job ${job.id} enqueued for WorkflowRun ${workflowRun.id}`);
  revalidatePath(`/dashboard/workflows`); 
  revalidatePath(`/dashboard/workflows/${workflowId}`);
  revalidatePath(`/dashboard/runs`); 

  return {
    success: true,
    workflowRunId: workflowRun.id,
    jobId: String(job.id),
    message: `Workflow "${workflow.name}" run enqueued.`,
  };
}

export async function getWorkflowRuns(workflowId?: string) {
  const userId = await getUserIdFromSession();
  return prisma.workflowRun.findMany({
    where: { 
      userId,
      ...(workflowId && { workflowId }), 
    },
    orderBy: { enqueuedAt: 'desc' },
    include: { workflow: { select: { name: true } } } 
  });
}

export async function getWorkflowRunDetails(workflowRunId: string) {
  const userId = await getUserIdFromSession();
  return prisma.workflowRun.findUnique({
    where: { id: workflowRunId, userId },
    include: { workflow: true }
  });
}

export async function getWorkflows() {
  const userId = await getUserIdFromSession();
  return prisma.workflow.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    // Optionally include related data like agent or run counts if needed for the list view
    // include: {
    //   _count: { select: { runs: true } },
    //   // If you store agent details in a separate table and link it:
    //   // agent: { select: { name: true, icon: true } }
    // }
  });
}

// New createWorkflow action
export async function createWorkflow(data: {
  name: string;
  description?: string;
  agentId: string;
  agentInput: Prisma.InputJsonValue;
  outputPipedreamAppSlug: string;
  outputPipedreamConnectedAccountId: string;
  outputConfiguration: Prisma.InputJsonValue;
}) {
  const userId = await getUserIdFromSession();

  if (!data.name || !data.agentId || !data.outputPipedreamAppSlug || !data.outputPipedreamConnectedAccountId) {
      throw new Error("Missing required workflow fields: name, agent, Pipedream app, and Pipedream account ID.");
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      agentId: data.agentId,
      agentInput: data.agentInput,
      outputPipedreamAppSlug: data.outputPipedreamAppSlug,
      outputPipedreamConnectedAccountId: data.outputPipedreamConnectedAccountId,
      outputConfiguration: data.outputConfiguration,
      triggerType: "manual", // Default trigger type
      status: "draft", // Default status
    },
  });
  revalidatePath("/dashboard/workflows");
  return workflow; 
}

export async function deleteWorkflow(workflowId: string) {
  const userId = await getUserIdFromSession();

  const workflowToDelete = await prisma.workflow.findUnique({
    where: { id: workflowId, userId },
  });

  if (!workflowToDelete) {
    throw new Error("Workflow not found or you don't have permission to delete it.");
  }

  await prisma.workflow.delete({
    where: { id: workflowId, userId }, // Ensure userId match for security
  });

  revalidatePath("/dashboard/workflows");
  revalidatePath("/dashboard/runs"); // Also revalidate runs page in case some runs were tied to this workflow
  console.log(`Workflow ${workflowId} deleted successfully by user ${userId}`);

  return {
    success: true,
    message: `Workflow "${workflowToDelete.name}" deleted successfully.`,
  };
}

export async function getWorkflowDetailsById(workflowId: string) {
  const userId = await getUserIdFromSession();

  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      userId: userId, // Ensure the user owns this workflow
    },
    include: {
      // Include any related data you want to show on the details page
      // For example, if you have agent details stored separately and linked:
      // agent: { select: { name: true, iconName: true, description: true } }, 
      runs: {
        orderBy: { enqueuedAt: 'desc' },
        take: 10, // Optionally limit the number of runs shown directly on the page
        select: { id: true, status: true, enqueuedAt: true, completedAt: true },
      },
      // _count: { select: { runs: true } } // Alternatively, just get the count of runs
    },
  });

  if (!workflow) {
    // Instead of throwing an error that might break rendering, 
    // you could return null or a specific error object that the page can handle gracefully.
    // For now, let's keep it simple and let Next.js handle it with a not-found page if desired.
    throw new Error("Workflow not found or you don't have permission to view it.");
  }

  // If agentId is just an ID and you have a local list of agents (like availableAgents in lib/agents.ts)
  // you might want to fetch the full agent object here to pass to the client.
  // This depends on how you want to manage agent information.
  // For now, we assume agentId is sufficient or handled client-side if needed from availableAgents.

  return workflow;
}

export async function updateWorkflow(workflowId: string, data: {
  name: string;
  description?: string;
  agentId: string;
  agentInput: Prisma.InputJsonValue;
  outputPipedreamAppSlug: string;
  outputPipedreamConnectedAccountId: string;
  outputConfiguration: Prisma.InputJsonValue;
  // status?: string; // Optionally allow status updates here too if needed
}) {
  const userId = await getUserIdFromSession();

  // First, verify the user owns the workflow they are trying to update
  const existingWorkflow = await prisma.workflow.findUnique({
    where: { id: workflowId, userId },
  });

  if (!existingWorkflow) {
    throw new Error("Workflow not found or you don't have permission to update it.");
  }

  if (!data.name || !data.agentId || !data.outputPipedreamAppSlug || !data.outputPipedreamConnectedAccountId) {
    throw new Error("Missing required workflow fields: name, agent, Pipedream app, and Pipedream account ID.");
  }

  const updatedWorkflow = await prisma.workflow.update({
    where: {
      id: workflowId,
      userId: userId, // Redundant due to the check above, but good for explicit safety
    },
    data: {
      name: data.name,
      description: data.description,
      agentId: data.agentId,
      agentInput: data.agentInput,
      outputPipedreamAppSlug: data.outputPipedreamAppSlug,
      outputPipedreamConnectedAccountId: data.outputPipedreamConnectedAccountId,
      outputConfiguration: data.outputConfiguration,
      // status: data.status || existingWorkflow.status, // Keep existing status if not provided
      updatedAt: new Date(), // Explicitly set updatedAt
    },
  });

  revalidatePath("/dashboard/workflows");
  revalidatePath(`/dashboard/workflows/${workflowId}`); // Revalidate the details page
  return updatedWorkflow;
} 