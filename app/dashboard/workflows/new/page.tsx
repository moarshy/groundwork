import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { getConnectedAccounts } from "@/app/actions/getConnectedAccounts"; 
import WorkflowForm from "./WorkflowForm"; 
import { redirect } from "next/navigation";
import { PipedreamConnectedAccount } from "@/types/pipedream";

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
    // Optionally, show a toast or error message to the user here, 
    // though this is a server component, so direct toast is not possible.
    // You might pass an error state to the WorkflowForm.
  }
  
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <WorkflowForm pipedreamAccounts={pipedreamAccounts} userId={session.user.id} />
    </div>
  );
} 