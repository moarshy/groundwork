import { getWorkflowDetailsById } from "@/app/actions/workflowActions";
import { availableAgents } from "@/lib/agents";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  PlayCircle, 
  Edit3, 
  Calendar,
  Clock,
  Settings,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Pause,
  Archive,
  Bot,
  Zap,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { notFound } from 'next/navigation';
import { cn } from "@/lib/utils";
import WorkflowActionsClient from "./WorkflowActionsClient";

// The params prop itself might be a Promise-like object in newer Next.js versions for Server Components
export default async function WorkflowDetailsPage({ params }: { params: Promise<{ workflowId: string }> | { workflowId: string } }) {
  // Await params to get the actual object with workflowId
  const resolvedParams = await params;
  const { workflowId } = resolvedParams;

  let workflow;
  try {
    workflow = await getWorkflowDetailsById(workflowId);
  } catch (error) {
    console.error("Failed to fetch workflow details:", error);
    return notFound();
  }

  if (!workflow) {
    return notFound();
  }

  const agent = workflow.agentId ? availableAgents.find(a => a.id === workflow.agentId) : null;

  // Calculate run statistics
  const runStats = workflow.runs ? workflow.runs.reduce((acc, run) => {
    acc.total++;
    if (run.status === 'completed') acc.completed++;
    if (run.status === 'failed') acc.failed++;
    if (run.status === 'running') acc.running++;
    return acc;
  }, { total: 0, completed: 0, failed: 0, running: 0 }) : { total: 0, completed: 0, failed: 0, running: 0 };

  const successRate = runStats.total > 0 ? Math.round((runStats.completed / runStats.total) * 100) : 0;

  return (
    <div className="min-h-screen">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/workflows">
            <Button variant="ghost" className="flex items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
              <ArrowLeft size={16} className="mr-2" />
              Back to Workflows
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <WorkflowActionsClient workflowId={workflow.id} workflowName={workflow.name} />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Workflow Header Card */}
            <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <Zap size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                          {workflow.name}
                        </CardTitle>
                        {workflow.description && (
                          <CardDescription className="text-lg mt-1 text-slate-600 dark:text-slate-400">
                            {workflow.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={workflow.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    icon={<Activity className="text-blue-500" />}
                    label="Total Runs"
                    value={runStats.total.toString()}
                    subValue={`${runStats.running} running`}
                  />
                  <MetricCard
                    icon={<TrendingUp className="text-green-500" />}
                    label="Success Rate"
                    value={`${successRate}%`}
                    subValue={`${runStats.completed} completed`}
                  />
                  <MetricCard
                    icon={<Clock className="text-purple-500" />}
                    label="Last Run"
                    value={workflow.runs?.[0] ? "Recently" : "Never"}
                    subValue={workflow.runs?.[0] ? new Date(workflow.runs[0].enqueuedAt).toLocaleDateString() : "No runs yet"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Runs */}
            <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold">
                  <Activity size={20} />
                  <span>Recent Runs</span>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Last 10 workflow executions</CardDescription>
              </CardHeader>
              <CardContent>
                {workflow.runs && workflow.runs.length > 0 ? (
                  <div className="space-y-3">
                    {workflow.runs.slice(0, 10).map((run, index) => (
                      <RunItem key={run.id} run={run} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Activity size={24} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">No runs found for this workflow yet.</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start by running your workflow above.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Workflow Details */}
            <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold">
                  <Settings size={20} />
                  <span>Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem
                  icon={<Calendar size={16} />}
                  label="Created"
                  value={new Date(workflow.createdAt).toLocaleDateString()}
                />
                <DetailItem
                  icon={<Clock size={16} />}
                  label="Last Updated"
                  value={new Date(workflow.updatedAt).toLocaleDateString()}
                />
                <DetailItem
                  icon={<Zap size={16} />}
                  label="Trigger Type"
                  value={workflow.triggerType}
                />
                <div className="border-t border-slate-200 dark:border-slate-700" />
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">WORKFLOW ID</p>
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded font-mono">
                    {workflow.id}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Agent Configuration */}
            {agent && (
              <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold">
                    <Bot size={20} />
                    <span>Agent</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{agent.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{agent.description}</p>
                  </div>
                  {workflow.agentInput && Object.keys(workflow.agentInput).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">DEFAULT INPUTS</p>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(workflow.agentInput, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Output Configuration */}
            {workflow.outputPipedreamAppSlug && (
              <Card className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold">
                    <Settings size={20} />
                    <span>Output</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DetailItem
                    label="App"
                    value={workflow.outputPipedreamAppSlug}
                  />
                  <DetailItem
                    label="Account ID"
                    value={workflow.outputPipedreamConnectedAccountId || 'N/A'}
                  />
                  {workflow.outputConfiguration && Object.keys(workflow.outputConfiguration).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">CONFIGURATION</p>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(workflow.outputConfiguration, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle2 size={14} />,
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg",
          pulse: true
        };
      case 'draft':
        return {
          icon: <Edit3 size={14} />,
          className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg",
          pulse: false
        };
      case 'paused':
        return {
          icon: <Pause size={14} />,
          className: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg",
          pulse: false
        };
      case 'archived':
        return {
          icon: <Archive size={14} />,
          className: "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg",
          pulse: false
        };
      default:
        return {
          icon: <XCircle size={14} />,
          className: "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg",
          pulse: false
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={cn(
      "flex items-center space-x-1 px-3 py-1 text-sm font-semibold rounded-full border-0 transition-all duration-200",
      config.className,
      config.pulse && "animate-pulse"
    )}>
      {config.icon}
      <span>{status?.toUpperCase() || 'UNKNOWN'}</span>
    </Badge>
  );
}

// Metric Card Component
function MetricCard({ icon, label, value, subValue }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">{subValue}</p>
        </div>
      </div>
    </div>
  );
}

// Detail Item Component
function DetailItem({ icon, label, value }: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      {icon && (
        <div className="mt-0.5 text-slate-600 dark:text-slate-300">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
}

// Enhanced Run Item Component
function RunItem({ run, index }: { run: any; index: number }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          icon: <CheckCircle2 size={16} className="text-green-500" />, 
          bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
        };
      case 'failed':
        return { 
          icon: <XCircle size={16} className="text-red-500" />, 
          bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
        };
      case 'running':
        return { 
          icon: <Activity size={16} className="text-blue-500 animate-pulse" />, 
          bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
        };
      default:
        return { 
          icon: <Clock size={16} className="text-slate-500" />, 
          bg: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" 
        };
    }
  };

  const config = getStatusConfig(run.status);

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
      config.bg
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {config.icon}
          <div>
            <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
              #{index + 1}
            </p>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {run.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {new Date(run.enqueuedAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(run.enqueuedAt).toLocaleTimeString()}
          </p>
        </div>
        <Link href={`/dashboard/runs/${run.id}`} className="ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 border-slate-300 dark:border-slate-700 transition-colors duration-150"
          >
            <Eye size={14} className="mr-1.5" />
            View Details
          </Button>
        </Link>
      </div>
      {run.completedAt && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Completed: {new Date(run.completedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}