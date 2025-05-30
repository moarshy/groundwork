import { getWorkflowRuns } from "@/app/actions/workflowActions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Info } from "lucide-react";

// Infer the type of a single run object from the getWorkflowRuns return type
type WorkflowRunWithName = Awaited<ReturnType<typeof getWorkflowRuns>>[number];

export default async function RunsHistoryPage() {
  const runs: WorkflowRunWithName[] = await getWorkflowRuns();

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === "completed") return "default"; 
    if (status === "failed") return "destructive";
    if (status === "processing") return "secondary"; 
    if (status === "queued") return "outline";
    return "secondary";
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Workflow Run History</h2>
        </div>

        {runs.length === 0 ? (
          <Card className="border-border bg-card shadow-sm rounded-xl">
            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
              <Info size={48} className="text-muted-foreground mb-6" strokeWidth={1.5} />
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Workflow Runs Yet</h3>
              <p className="text-md text-muted-foreground max-w-md">
                When you run workflows, their history will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="text-xl">All Runs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="px-6 py-4 text-muted-foreground">Workflow</TableHead>
                    <TableHead className="px-6 py-4 text-muted-foreground">Run ID</TableHead>
                    <TableHead className="px-6 py-4 text-muted-foreground">Status</TableHead>
                    <TableHead className="px-6 py-4 text-muted-foreground">Enqueued</TableHead>
                    <TableHead className="px-6 py-4 text-muted-foreground">Completed</TableHead>
                    <TableHead className="px-6 py-4 text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run: WorkflowRunWithName) => (
                    <TableRow key={run.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium px-6 py-4 text-foreground">{run.workflow.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm px-6 py-4">
                        {run.id.substring(0,12)}...
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant={getStatusBadgeVariant(run.status)} className="capitalize text-xs font-medium py-1 px-2.5 rounded-full">
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground px-6 py-4">
                        {new Date(run.enqueuedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground px-6 py-4">
                        {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Link href={`/dashboard/runs/${run.id}`} className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium">
                          View Details <ArrowRight size={14} className="ml-1.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
} 