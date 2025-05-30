"use client";

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DesirableApp } from "./page";
import { generatePipedreamConnectUrl } from "@/app/actions/generatePipedreamConnectUrl";
import { disconnectPipedreamAccount } from "@/app/actions/disconnectPipedreamAccount";
import { disconnectAllPipedreamAccounts } from "@/app/actions/disconnectAllPipedreamAccounts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import specific icons you intend to use & add new ones
import {
  Mail, Sheet, MessageSquare, HelpCircle, Github, Slack, FolderKanban, UsersRound, AlertTriangle, CheckCircle2, Plug, XCircle, Trash2,
  type LucideIcon
} from "lucide-react";

// Create an explicit map for icon components
const iconMap = {
  Mail,
  Sheet,
  MessageSquare,
  HelpCircle, // Fallback icon
  Github,
  Slack,
  FolderKanban,
  UsersRound,
  AlertTriangle, // For errors or warnings
  CheckCircle2,
  Plug,
  XCircle,
  Trash2,
};

export interface ConnectPageClientProps {
  apps: (DesirableApp & { isConnected: boolean; connectedAccountId?: string; status: string; logoUrl?: string })[];
}

// Helper to get the icon component by name from our map
const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName as keyof typeof iconMap] || iconMap.HelpCircle;
};

export default function ConnectPageClient({ apps }: ConnectPageClientProps) {
  const [loadingAppSlug, setLoadingAppSlug] = useState<string | null>(null);
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<string | null>(null);
  const [isDisconnectingAll, setIsDisconnectingAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConnect = async (appSlug: string, appName: string) => {
    setLoadingAppSlug(appSlug);
    const toastId = `connect-${appSlug}`;
    toast.loading(`Preparing connection for ${appName}...`, { id: toastId });

    try {
      const result = await generatePipedreamConnectUrl({ appSlug });
      if (result.connectUrl) {
        window.open(result.connectUrl, '_blank', 'noopener,noreferrer');
        toast.success(`Redirecting to ${appName} for connection. Please complete the process in the new tab. You may need to refresh this page afterwards.`, { id: toastId, duration: 8000 });
      } else if (result.error) {
        toast.error(`Error preparing connection for ${appName}: ${result.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error(`An unexpected error occurred while connecting ${appName}. Please try again.`, { id: toastId });
    } finally {
      setLoadingAppSlug(null);
    }
  };

  const handleDisconnect = async (pipedreamAccountId: string, appName: string) => {
    if (!pipedreamAccountId) {
      toast.error("Account ID is missing, cannot disconnect.");
      return;
    }
    setDisconnectingAccountId(pipedreamAccountId);
    toast.loading(`Disconnecting ${appName}...`, { id: `disconnect-${pipedreamAccountId}` });

    startTransition(async () => {
      try {
        const result = await disconnectPipedreamAccount({ pipedreamAccountId });
        if (result.success) {
          toast.success(result.message || `${appName} disconnected successfully. Refreshing...`, { id: `disconnect-${pipedreamAccountId}` });
        } else {
          toast.error(result.error || `Failed to disconnect ${appName}.`, { id: `disconnect-${pipedreamAccountId}` });
        }
      } catch (error) {
        console.error("Disconnect error:", error);
        toast.error(`An unexpected error occurred while disconnecting ${appName}.`, { id: `disconnect-${pipedreamAccountId}` });
      } finally {
        setDisconnectingAccountId(null);
      }
    });
  };

  const handleDisconnectAll = async () => {
    console.log("[ConnectPageClient] handleDisconnectAll called");
    setIsDisconnectingAll(true);
    toast.loading("Disconnecting all accounts...", { id: "disconnect-all" });
    
    startTransition(async () => {
      console.log("[ConnectPageClient] Starting transition for disconnectAllPipedreamAccounts");
      try {
        const result = await disconnectAllPipedreamAccounts();
        console.log("[ConnectPageClient] disconnectAllPipedreamAccounts result:", result);

        if (result.success) {
          toast.success(result.message || "All accounts disconnected successfully. Refreshing...", { id: "disconnect-all" });
        } else {
          toast.error(result.error || "Failed to disconnect all accounts.", { id: "disconnect-all" });
        }
      } catch (error) {
        console.error("[ConnectPageClient] Error in disconnectAllPipedreamAccounts transition:", error);
        toast.error("An unexpected error occurred while disconnecting all accounts.", { id: "disconnect-all" });
      } finally {
        console.log("[ConnectPageClient] Finished transition, setting isDisconnectingAll to false.");
        setIsDisconnectingAll(false);
      }
    });
  };

  const connectedAppsCount = apps.filter(app => app.isConnected).length;

  return (
    <div>
      <p className="text-muted-foreground mb-6 text-sm">
        Connect your most used applications to Groundwork to unlock powerful automations.
        You will be redirected to authenticate and authorize connections.
      </p>
      
      <div className="flex flex-row gap-3 overflow-x-auto pb-3 mb-6"> 
        {apps.map((app) => {
          const IconComponent = getIcon(app.iconName);
          const PlugIcon = iconMap.Plug;
          const DisconnectIcon = iconMap.XCircle;

          return (
            <Card 
              key={app.slug} 
              className="relative flex items-center justify-between p-2 pr-8 hover:shadow-sm rounded-md w-72 flex-shrink-0"
            >
              {app.isConnected && (
                <span 
                  className={cn(
                    "absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full",
                    app.status === "Error" ? "bg-red-500" : "bg-green-500"
                  )}
                  title={`Status: ${app.status}`}
                />
              )}

              <div className="flex items-center space-x-2 flex-grow min-w-0">
                {app.logoUrl ? (
                  <img src={app.logoUrl} alt={`${app.name} logo`} className="h-6 w-6"/>
                ) : (
                  <IconComponent size={24} className="text-primary" />
                )}
                <span className="text-sm font-medium text-card-foreground">{app.name}</span>
              </div>
              
              <div className="ml-2 flex-shrink-0 flex items-center">
                {app.isConnected && app.connectedAccountId ? (
                  <Button
                    onClick={() => handleDisconnect(app.connectedAccountId!, app.name)}
                    disabled={disconnectingAccountId === app.connectedAccountId || isPending || isDisconnectingAll}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 py-1 rounded-md group text-destructive/80 hover:text-destructive hover:bg-destructive/10 border border-destructive/30 hover:border-destructive/50 transition-colors duration-150 flex items-center space-x-1.5"
                    title={`Disconnect ${app.name}`}
                  >
                    <DisconnectIcon size={14} className="transition-colors duration-150" />
                    <span className="text-xs">Disconnect</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(app.slug, app.name)}
                    disabled={loadingAppSlug === app.slug || isPending || isDisconnectingAll}
                    size="sm"
                    variant="outline"
                    className="text-xs p-1 h-7 flex items-center text-primary dark:text-primary-foreground border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/5"
                  >
                    <PlugIcon size={12} className="mr-1" />
                    <span>{loadingAppSlug === app.slug ? "Connecting..." : "Connect"}</span>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {connectedAppsCount > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3">Manage All Connections</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You have {connectedAppsCount} application(s) connected. You can disconnect all of them at once.
            This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-red-700 dark:border-red-600"
                disabled={isPending || isDisconnectingAll}
              >
                <Trash2 size={16} className="mr-2" />
                {isDisconnectingAll ? "Disconnecting All..." : "Disconnect All Accounts"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ 
              backgroundColor: 'var(--popover)',
              color: 'var(--popover-foreground)',
            }} className="p-6 rounded-lg shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently disconnect all your connected applications from Groundwork.
                  You will need to re-authenticate each application if you wish to use them again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => console.log("[ConnectPageClient] Cancel clicked")} 
                  disabled={isDisconnectingAll}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    console.log("[ConnectPageClient] AlertDialogAction (Confirm Disconnect All) onClick fired!"); 
                    handleDisconnectAll();
                  }} 
                  disabled={isDisconnectingAll}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDisconnectingAll ? "Disconnecting..." : "Yes, Disconnect All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
} 