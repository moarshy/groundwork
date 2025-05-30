"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { type Agent, agentIconMap } from '@/lib/agents';

interface AgentCardClientProps {
  agent: Agent;
}

export default function AgentCardClient({ agent }: AgentCardClientProps) {
  const IconComponent = agentIconMap[agent.iconName] || agentIconMap.Bot;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
          <CardHeader className="flex flex-row items-start space-x-3 pb-3">
            <IconComponent size={28} className="text-primary mt-1" />
            <div>
              <CardTitle className="text-lg mb-1">{agent.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 text-muted-foreground">{agent.category}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-card-foreground/80 line-clamp-3">{agent.description}</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent style={{
          backgroundColor: 'var(--popover)', 
          color: 'var(--popover-foreground)',
        }} className="p-6 rounded-lg shadow-xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center mb-2">
            <IconComponent size={32} className="mr-3 text-primary" />
            <DialogTitle className="text-2xl text-popover-foreground">{agent.name}</DialogTitle>
          </div>
          <DialogDescription className="text-popover-foreground/80 pt-1">
            {agent.longDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1 text-popover-foreground">Category:</h4>
            <p className="text-popover-foreground/80">{agent.category}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-popover-foreground">Inputs Expected:</h4>
            <ul className="list-disc list-inside text-popover-foreground/80 pl-4">
              {agent.inputsExpected.map((input, i) => <li key={i}>{input}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-popover-foreground">Outputs Provided:</h4>
            <ul className="list-disc list-inside text-popover-foreground/80 pl-4">
              {agent.outputsProvided.map((output, i) => <li key={i}>{output}</li>)}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 