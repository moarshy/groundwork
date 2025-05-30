"use client";

import React, { useMemo } from 'react';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkflowForm from "@/app/dashboard/workflows/new/WorkflowForm";
import type { Workflow } from "@/lib/generated/prisma";
import type { PipedreamConnectedAccount } from '@/types/pipedream';

interface EditWorkflowClientPageProps {
  workflowId: string;
  userId: string;
  initialWorkflowData: Workflow | null; // Allow null if workflow isn't found, though page.tsx should handle notFound
  pipedreamAccounts: PipedreamConnectedAccount[];
}

export default function EditWorkflowClientPage({ 
  workflowId, 
  userId, 
  initialWorkflowData, 
  pipedreamAccounts 
}: EditWorkflowClientPageProps) {

  // Memoize formCompatibleWorkflowData
  const formCompatibleWorkflowData = useMemo(() => {
    if (!initialWorkflowData) return null;
    return {
      ...initialWorkflowData,
      agentInput: initialWorkflowData.agentInput && typeof initialWorkflowData.agentInput === 'object' 
                    ? initialWorkflowData.agentInput 
                    : {},
      outputConfiguration: initialWorkflowData.outputConfiguration && typeof initialWorkflowData.outputConfiguration === 'object' 
                           ? initialWorkflowData.outputConfiguration 
                           : {},
    };
  }, [initialWorkflowData]);

  if (!formCompatibleWorkflowData) {
    // This case should ideally be handled by notFound() in the Server Component,
    // but as a fallback, prevent rendering the form with null data.
    return <p>Workflow data is not available.</p>;
  }
  
  console.log("[EditWorkflowClientPage] Workflow data to edit (form compatible):", JSON.stringify(formCompatibleWorkflowData, null, 2));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 mb-6">
            <Link href={`/dashboard/workflows/${workflowId}`}>
                <Button variant="outline" className="flex items-center">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Workflow Details
                </Button>
            </Link>
        </div>
        <WorkflowForm 
            userId={userId} 
            pipedreamAccounts={pipedreamAccounts}
            initialWorkflowData={formCompatibleWorkflowData as any} // Cast as any, as WorkflowForm expects a more specific type after Prisma annd Pipedream objects
        />
    </div>
  );
} 