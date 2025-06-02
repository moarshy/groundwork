import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getWorkflows } from "@/app/actions/workflowActions"; // Import action for workflows
import { getConnectedAccounts } from "@/app/actions/getConnectedAccounts"; // Import action for connections
import { PipedreamConnectedAccount } from "@/types/pipedream"; // Type for connected accounts
import { Workflow } from "@/lib/generated/prisma"; // Type for workflows
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

// This page is now automatically wrapped by app/dashboard/layout.tsx
// which handles session checking and applies DashboardLayout.

export default async function DashboardPage() {
  // Session is guaranteed to exist here due to the layout.tsx check.
  // However, to access session.user details, we still need to fetch it.
  const session = await getServerSession(authOptions);
  const [workflows, connectedAccounts] = await Promise.all([
    getWorkflows(),
    getConnectedAccounts(),
  ]);

  const workflowCount = workflows.length;
  const connectionCount = connectedAccounts.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          Welcome, {session?.user?.name || session?.user?.email}!
        </h2>
        <p className="text-muted-foreground">
          Here's a quick overview of your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>Manage and automate your tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{workflowCount}</p>
            <p className="text-sm text-muted-foreground">
              {workflowCount === 1 ? "workflow configured" : "workflows configured"}.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard/workflows">
                Go to Workflows <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>Link your external applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{connectionCount}</p>
            <p className="text-sm text-muted-foreground">
              {connectionCount === 1 ? "application connected" : "applications connected"}.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard/connect">
                Manage Connections <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* You can add more summary sections here as needed */}
    </div>
  );
} 