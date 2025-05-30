"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // For router.refresh()
import { enqueueWorkflowRun, deleteWorkflow } from "@/app/actions/workflowActions";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { PlayCircle, Trash2, AlertTriangle, Zap, ClockIcon } from 'lucide-react'; // Added icons for trigger/status
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'; // Import Link

// Basic Workflow type needed for this component
interface WorkflowItem {
  id: string;
  name: string;
  createdAt: string;
  description?: string | null;
  status: string;
  triggerType: string;
}

interface WorkflowListClientProps {
  workflows: WorkflowItem[];
}

export default function WorkflowListClient({ workflows }: WorkflowListClientProps) {
  const router = useRouter();
  const [isEnqueuing, setIsEnqueuing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowItem | null>(null);

  const handleRunWorkflow = async (workflowId: string, workflowName: string) => {
    setIsEnqueuing(workflowId);
    toast.loading(`Enqueuing run for "${workflowName}"...`, { id: `enqueue-${workflowId}` });
    try {
      const result = await enqueueWorkflowRun({ workflowId });
      if (result.success && result.workflowRunId) {
        toast.success(result.message, { id: `enqueue-${workflowId}` });
        router.push(`/dashboard/runs/${result.workflowRunId}`); // Redirect to the specific run details page
      } else {
        // It's good practice to check for a message in the result even on failure, 
        // but the current enqueueWorkflowRun throws an error on failure.
        // Also handle cases where workflowRunId might be missing, though it shouldn't if success is true.
        toast.error(result.message || 'Failed to enqueue workflow or get run ID.', { id: `enqueue-${workflowId}` });
      }
    } catch (error: any) {
      toast.error(`Failed to enqueue workflow: ${error.message}`, { id: `enqueue-${workflowId}` });
    } finally {
      setIsEnqueuing(null);
    }
  };

  const confirmDeleteWorkflow = (workflow: WorkflowItem) => {
    setWorkflowToDelete(workflow);
    setShowDeleteDialog(true);
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    setIsDeleting(workflowToDelete.id);
    setShowDeleteDialog(false);
    toast.loading(`Deleting workflow "${workflowToDelete.name}"...`, { id: `delete-${workflowToDelete.id}` });

    try {
      const result = await deleteWorkflow(workflowToDelete.id);
      if (result.success) {
        toast.success(result.message, { id: `delete-${workflowToDelete.id}` });
        router.refresh(); // Refresh the list
      } else {
        toast.error(result.message || 'Failed to delete workflow.', { id: `delete-${workflowToDelete.id}` });
      }
    } catch (error: any) {
      toast.error(`Error deleting workflow: ${error.message}`, { id: `delete-${workflowToDelete.id}` });
    } finally {
      setIsDeleting(null);
      setWorkflowToDelete(null);
    }
  };

  if (!workflows || workflows.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No workflows found. Create one to get started!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
          <div className="p-6">
            <Link href={`/dashboard/workflows/${workflow.id}`} className="group">
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{workflow.name}</h3>
            </Link>
            {workflow.description && (
              <p className="text-sm text-muted-foreground mt-1 mb-2 break-words line-clamp-2">
                {workflow.description}
              </p>
            )}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1.5 mb-3">
              <div className="flex items-center">
                {workflow.triggerType === 'manual' ? <PlayCircle size={12} className="mr-1" /> : 
                 workflow.triggerType === 'webhook' ? <Zap size={12} className="mr-1" /> : 
                 workflow.triggerType === 'scheduled' ? <ClockIcon size={12} className="mr-1" /> : 
                 <AlertTriangle size={12} className="mr-1" />}
                <span>{workflow.triggerType.charAt(0).toUpperCase() + workflow.triggerType.slice(1)}</span>
              </div>
              <span>•</span>
              <p>
                Created: {new Date(workflow.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge 
                variant={workflow.status === 'active' || workflow.status === 'enabled' ? 'default' : 
                         workflow.status === 'draft' ? 'secondary' : 
                         workflow.status === 'paused' || workflow.status === 'disabled' ? 'outline' : 
                         'destructive'} 
                className="capitalize text-xs font-medium py-0.5 px-2 rounded-full"
            >
                {workflow.status}
            </Badge>
          </div>
          <div className="bg-muted/50 p-4 flex items-center justify-end space-x-3 border-t border-border rounded-b-xl">
            <Button 
              onClick={() => handleRunWorkflow(workflow.id, workflow.name)} 
              disabled={isEnqueuing === workflow.id || isDeleting === workflow.id}
              variant="ghost" // Changed variant
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-500/10 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-500/10"
            >
              <PlayCircle size={16} className="mr-2"/> 
              {isEnqueuing === workflow.id ? 'Enqueuing...' : 'Run'}
            </Button>
            <Button
              onClick={() => confirmDeleteWorkflow(workflow)}
              disabled={isDeleting === workflow.id || isEnqueuing === workflow.id}
              variant="ghost" // Changed variant
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={16} className="mr-2"/>
              {isDeleting === workflow.id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      ))}
      {workflowToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete "{workflowToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the workflow and all its associated run history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setWorkflowToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteWorkflow} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Workflow
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 