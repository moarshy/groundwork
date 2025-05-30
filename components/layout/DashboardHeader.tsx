"use client";

import React from "react";
import { usePathname, useRouter } from 'next/navigation'; // Import usePathname and useRouter
import { PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Using Shadcn Button
import CreateWorkflowButtonClient from "@/app/dashboard/workflows/CreateWorkflowButtonClient";

// No longer needs currentSectionTitle prop
// interface DashboardHeaderProps {
//   currentSectionTitle: string;
// }

// Helper function to derive title from pathname
const getTitleFromPathname = (pathname: string): string => {
  if (pathname.startsWith("/dashboard/workflows/new")) return "Create New Workflow"; // More specific for new
  if (pathname.startsWith("/dashboard/workflows/")) return "Workflow Details"; // For individual workflow details
  if (pathname.startsWith("/dashboard/workflows")) return "Workflows";
  if (pathname.startsWith("/dashboard/connect")) return "Connect Apps";
  if (pathname.startsWith("/dashboard/agents")) return "AI Agents";
  if (pathname.startsWith("/dashboard/runs/")) return "Run Details"; // For individual run details
  if (pathname.startsWith("/dashboard/runs")) return "Workflow Runs"; // For the list of runs
  if (pathname.startsWith("/dashboard/history")) return "Event History";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname === "/dashboard") return "Dashboard Overview";
  return "Dashboard"; // Default fallback
};

export default function DashboardHeader(/* { currentSectionTitle }: DashboardHeaderProps */) {
  const pathname = usePathname();
  const router = useRouter(); // For navigation if New button has actions
  const currentSectionTitle = getTitleFromPathname(pathname);

  const showButtons = pathname.startsWith("/dashboard");

  return (
    <header className="bg-card-bg shadow-sm p-4 border-b border-neutral-text-secondary/10">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-text-primary">
          {currentSectionTitle}
        </h1>
        {showButtons && (
          <div className="flex items-center space-x-2">
            <CreateWorkflowButtonClient
              href="/dashboard/connect"
              size="sm"
              variant={null}
              className="flex items-center space-x-2 bg-gradient-primary text-white hover:opacity-90 transition-opacity"
              icon={<PlusCircle size={17} className="mr-2" />}
            >
              New Connection
            </CreateWorkflowButtonClient>
            <CreateWorkflowButtonClient
              href="/dashboard/workflows/new"
              size="sm"
              className="flex items-center space-x-2 bg-gradient-primary text-white hover:opacity-90 transition-opacity"
              icon={<PlusCircle size={17} className="mr-2" />}
            >
              New Workflow
            </CreateWorkflowButtonClient>
          </div>
        )}
      </div>
    </header>
  );
} 