import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { getConnectedAccounts } from "@/app/actions/getConnectedAccounts"; 
import WorkflowForm from "./WorkflowForm"; 
import { redirect } from "next/navigation";
import { PipedreamConnectedAccount } from "@/types/pipedream";

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

export default async function NewWorkflowPage() {
  const session = await getServerSession(authOptions); 
  if (!session || !session.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard/workflows/new');
  }

  let pipedreamAccounts: PipedreamConnectedAccount[] = [];
  try {
    pipedreamAccounts = await getConnectedAccounts();
    console.log("[Server Component] Fetched Pipedream Accounts:", JSON.stringify(pipedreamAccounts, null, 2));
  } catch (error) {
    console.error("Failed to fetch Pipedream accounts:", error);
    // During build or when Pipedream is not configured, just continue with empty array
    // The WorkflowForm will handle the empty state appropriately
  }
  
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <WorkflowForm pipedreamAccounts={pipedreamAccounts} userId={session.user.id} />
    </div>
  );
} 