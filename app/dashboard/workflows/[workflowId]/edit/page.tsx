import { getWorkflowDetailsById } from "@/app/actions/workflowActions";
import { getConnectedAccounts } from "@/app/actions/getConnectedAccounts";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound, redirect } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import EditWorkflowClientPage from './EditWorkflowClientPage';
import type { Workflow } from "@/lib/generated/prisma";

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

interface EditWorkflowPageProps {
  params: Promise<{
    workflowId: string;
  }>;
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  // Await the params Promise
  const { workflowId } = await params;
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/workflows");
  }

  let workflowToEdit: Workflow | null = null;
  try {
    workflowToEdit = await prisma.workflow.findUnique({
        where: { id: workflowId, userId: session.user.id },
    });
  } catch (error) {
    console.error("Failed to fetch workflow for editing:", error);
    return notFound(); 
  }

  if (!workflowToEdit) {
    return notFound();
  }

  const pipedreamAccounts = await getConnectedAccounts();

  return (
    <EditWorkflowClientPage 
      workflowId={workflowId}
      userId={session.user.id}
      initialWorkflowData={workflowToEdit}
      pipedreamAccounts={pipedreamAccounts}
    />
  );
}