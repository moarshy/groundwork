import { getWorkflowRunDetails } from "@/app/actions/workflowActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {notFound} from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Function to determine badge variant based on status
const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === "completed") return "default"; 
    if (status === "failed") return "destructive";
    if (status === "processing") return "secondary"; 
    if (status === "queued") return "outline";
    return "secondary";
};

export default async function RunDetailsPage({ params }: { params: { runId: string } }) {
    const run = await getWorkflowRunDetails(params.runId);

    if (!run) {
        notFound();
    }

    // Ensure logs are an array, even if null/undefined from DB (Json? type)
    const displayLogs = Array.isArray(run.logs) ? run.logs.join('\n') : 'No logs recorded or logs are not in expected format.';

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <Link href="/dashboard/runs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft size={16} className="mr-1" />
                Back to All Runs
            </Link>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Run Details</CardTitle>
                            <CardDescription>Workflow: {run.workflow.name}</CardDescription>
                        </div>
                        <Badge variant={getStatusBadgeVariant(run.status)} className="capitalize text-sm px-3 py-1">
                            {run.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><strong>Run ID:</strong> <span className="text-muted-foreground font-mono text-xs">{run.id}</span></div>
                        <div><strong>Workflow ID:</strong> <span className="text-muted-foreground font-mono text-xs">{run.workflowId}</span></div>
                        <div><strong>Enqueued:</strong> <span className="text-muted-foreground">{new Date(run.enqueuedAt).toLocaleString()}</span></div>
                        {run.startedAt && <div><strong>Started:</strong> <span className="text-muted-foreground">{new Date(run.startedAt).toLocaleString()}</span></div>}
                        {run.completedAt && <div><strong>Completed:</strong> <span className="text-muted-foreground">{new Date(run.completedAt).toLocaleString()}</span></div>}
                        {run.bullJobId && <div><strong>Job ID:</strong> <span className="text-muted-foreground font-mono text-xs">{run.bullJobId}</span></div>}
                    </div>

                    {run.errorMessage && (
                        <div>
                            <h4 className="font-semibold text-destructive mb-1">Error Message:</h4>
                            <pre className="bg-destructive/10 p-3 rounded-md text-xs text-destructive whitespace-pre-wrap overflow-x-auto">
                                {run.errorMessage}
                            </pre>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold text-foreground mb-1 mt-3">Logs:</h4>
                        {run.logs && (Array.isArray(run.logs) && run.logs.length > 0) ? (
                            <pre className="bg-muted/50 p-4 rounded-md text-xs whitespace-pre-wrap overflow-x-auto max-h-96 text-foreground">
                                {displayLogs}
                            </pre>
                        ) : (
                            <p className="text-muted-foreground text-sm">No logs recorded for this run yet.</p>
                        )}
                    </div>
                     {/* Display agentInput and agentOutput if they exist */}
                    {run.agentInput && Object.keys(run.agentInput).length > 0 && (
                        <div>
                            <h4 className="font-semibold text-foreground mb-1 mt-3">Agent Input:</h4>
                            <pre className="bg-muted/50 p-4 rounded-md text-xs whitespace-pre-wrap overflow-x-auto max-h-60 text-foreground">
                                {JSON.stringify(run.agentInput, null, 2)}
                            </pre>
                        </div>
                    )}
                    {run.agentOutput && Object.keys(run.agentOutput).length > 0 && (
                        <div>
                            <h4 className="font-semibold text-foreground mb-1 mt-3">Agent Output:</h4>
                            <pre className="bg-muted/50 p-4 rounded-md text-xs whitespace-pre-wrap overflow-x-auto max-h-60 text-foreground">
                                {JSON.stringify(run.agentOutput, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 