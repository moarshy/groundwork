import React from 'react';
import { getConnectedAccounts } from "@/app/actions/getConnectedAccounts";
import ConnectPageClient from "./ConnectPageClient";
// import type { SupportedService } from "./ConnectPageClient"; // This type is no longer used here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipedreamConnectedAccount } from "@/types/pipedream";

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

// No longer need to import individual icons here, client component handles it.

// Define the apps you want to offer for connection
// The `slug` should match Pipedream's app slug (e.g., 'google_sheets', 'slack')
// The `iconName` should match a valid Lucide icon name as used in your Icon component / iconMap
const desirableAppIntegrations = [
  {
    name: "Google Sheets",
    slug: "google_sheets",
    description: "Connect your Google Sheets for data workflows.",
    iconName: "Sheet", 
  },
  {
    name: "Slack",
    slug: "slack",
    description: "Integrate with Slack for notifications and actions.",
    iconName: "Slack",
  },
  {
    name: "GitHub",
    slug: "github", 
    description: "Connect GitHub for repository-related automations.",
    iconName: "Github",
  },
  {
    name: "Google Drive",
    slug: "google_drive",
    description: "Access and manage files in Google Drive.",
    iconName: "FolderKanban", // Or another suitable Drive-like icon
  },
  // {
  //   name: "HubSpot",
  //   slug: "hubspot",
  //   description: "Connect HubSpot CRM for customer data workflows.",
  //   iconName: "UsersRound", // Generic CRM icon
  // },
  // Add more apps as needed
];

export type DesirableApp = typeof desirableAppIntegrations[number];

export default async function ConnectPage() {
  const connectedAccounts: PipedreamConnectedAccount[] = await getConnectedAccounts();

  // Enhance desirable apps with their connection status
  const appsWithStatus = desirableAppIntegrations.map(app => {
    const connectedAccount = connectedAccounts.find(acc => acc.appNameSlug === app.slug || acc.app.toLowerCase().includes(app.slug.replace("_", " ")));
    return {
      ...app,
      isConnected: !!connectedAccount,
      connectedAccountId: connectedAccount?.id,
      status: connectedAccount ? (connectedAccount.healthy ? "Connected" : "Error") : "Not Connected",
      logoUrl: connectedAccount?.logoUrl, // Use Pipedream's logo if available
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect Applications</CardTitle>
          <CardDescription>
            Manage your connections to third-party applications to automate your workflows.
            You will be redirected to authenticate and authorize new connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectPageClient apps={appsWithStatus} />
        </CardContent>
      </Card>

      {/* Optional: Display a summary of currently connected accounts directly on this page */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Currently Connected Accounts</CardTitle>
            <CardDescription>Overview of your active connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  {account.logoUrl && <img src={account.logoUrl} alt={`${account.app} logo`} className="h-6 w-6"/>}
                  <span>{account.app}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${account.healthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <Badge variant={account.healthy ? "default" : "destructive"} className="text-xs">
                    {account.healthy ? "Healthy" : "Error"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 