"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlayCircle, Edit3, Loader2 } from 'lucide-react';
import { enqueueWorkflowRun } from '@/app/actions/workflowActions';
import { toast } from 'sonner';
import Link from 'next/link';

interface WorkflowActionsClientProps {
  workflowId: string;
  workflowName: string;
  // Add any other props needed, e.g., for edit functionality
}

export default function WorkflowActionsClient({ workflowId, workflowName }: WorkflowActionsClientProps) {
  const router = useRouter();
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  // const [isEditing, setIsEditing] = useState(false); // For edit button if it needs client logic

  const handleRunWorkflow = async () => {
    setIsEnqueuing(true);
    toast.loading(`Enqueuing run for "${workflowName}"...`, { id: `enqueue-detail-${workflowId}` });
    try {
      const result = await enqueueWorkflowRun({ workflowId });
      if (result.success) {
        toast.success(result.message, { id: `enqueue-detail-${workflowId}` });
        // Optionally, navigate to the runs page or refresh data if runs are shown on this page
        router.refresh(); // Refreshes server components, re-fetching runs for the list
      } else {
        toast.error(result.message || 'Failed to enqueue workflow run.', { id: `enqueue-detail-${workflowId}` });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: `enqueue-detail-${workflowId}` });
    } finally {
      setIsEnqueuing(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Link href={`/dashboard/workflows/${workflowId}/edit`}>
        <Button 
          variant="outline" 
          className="shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          disabled={isEnqueuing}
        >
          <Edit3 size={16} className="mr-2" />
          Edit
        </Button>
      </Link>
      <Button 
        onClick={handleRunWorkflow} 
        disabled={isEnqueuing}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isEnqueuing ? (
          <Loader2 size={16} className="mr-2 animate-spin" />
        ) : (
          <PlayCircle size={16} className="mr-2" />
        )}
        {isEnqueuing ? 'Enqueuing...' : 'Run Workflow'}
      </Button>
    </div>
  );
} 