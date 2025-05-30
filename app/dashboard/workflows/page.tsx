import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import WorkflowListClient from './WorkflowListClient';
import CreateWorkflowButtonClient from './CreateWorkflowButtonClient';
import { getWorkflows } from '@/app/actions/workflowActions';
import type { Workflow } from '@/lib/generated/prisma';

// Define the shape of the props for WorkflowListClient
interface ClientWorkflowItem {
  id: string;
  name: string;
  createdAt: string; // Ensure createdAt is a string
  description?: string | null;
  status: string;
  triggerType: string;
}

export default async function WorkflowsPage() {
  const rawWorkflows = await getWorkflows();
  // console.log("Workflows fetched on server in /dashboard/workflows/page.tsx:", JSON.stringify(workflows, null, 2));
  // Using a simpler log to avoid issues if workflows contain non-serializable parts for JSON.stringify, though Prisma types usually are.
  console.log("Raw workflows fetched on server in /dashboard/workflows/page.tsx. Count:", rawWorkflows?.length);
  if (rawWorkflows && rawWorkflows.length > 0) {
    console.log("First raw workflow details:", rawWorkflows[0]);
  }

  const workflowsForClient: ClientWorkflowItem[] = rawWorkflows.map((wf: Workflow) => ({
    id: wf.id,
    name: wf.name,
    createdAt: wf.createdAt.toISOString(), // Convert Date to string
    description: wf.description,
    status: wf.status,
    triggerType: wf.triggerType,
  }));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Workflows</h2>
        <CreateWorkflowButtonClient 
          href="/dashboard/workflows/new"
          variant="default"
          className="flex items-center space-x-2"
          icon={<PlusCircle size={18} className="mr-2" />}
        >
          Create New Workflow
        </CreateWorkflowButtonClient>
      </div>

      {/* Placeholder for Workflow List */}
      {workflowsForClient.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-border rounded-xl bg-card shadow-sm">
          <PlusCircle size={48} className="text-muted-foreground mb-6" strokeWidth={1.5} />
          <h3 className="text-2xl font-semibold text-foreground mb-3">Create Your First Workflow</h3>
          <p className="text-md text-muted-foreground mb-8 max-w-md">
            Automate your tasks by setting up workflows. Click the button below to get started.
          </p>
          <CreateWorkflowButtonClient 
            href="/dashboard/workflows/new"
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            icon={<PlusCircle size={20} className="mr-2.5" />}
          >
            Create New Workflow
          </CreateWorkflowButtonClient>
        </div>
      ) : (
        <WorkflowListClient workflows={workflowsForClient} />
        // <p className="text-muted-foreground">Workflow list will appear here.</p>
      )}
    </div>
  );
} 