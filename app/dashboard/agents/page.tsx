import { availableAgents } from '@/lib/agents'; 
import AgentCardClient from './AgentCardClient'; 
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <CardHeader className="px-0 py-4">
        <CardTitle>AI Agent Catalogue</CardTitle>
        <CardDescription>
          Explore available JavaScript AI agents to integrate into your workflows.
          Click on an agent to learn more about its capabilities.
        </CardDescription>
      </CardHeader>

      {availableAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableAgents.map((agent) => (
            <AgentCardClient key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No AI agents are currently available.</p>
      )}
    </div>
  );
} 