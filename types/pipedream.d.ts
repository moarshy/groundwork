export interface PipedreamAppDetails {
  id: string; // e.g. "app_OkrhR1"
  name: string; // e.g. "Slack"
  name_slug?: string; // e.g. "slack"
  img_src?: string; // URL to the app logo
  // Add other app details if needed from Pipedream's response
}

export interface PipedreamConnectedAccount {
  id: string; // Pipedream's internal ID for the connected account (e.g., "apn_XehyZPr")
  app: string; // Name of the connected app (e.g., "GitHub", "Slack") - simplified from PipedreamAppDetails.name
  appNameSlug: string; // Slug or ID for the app (e.g., "github", "app_OkrhR1")
  externalId: string; // The external_user_id you provided (your app's user.id)
  healthy: boolean | null;
  logoUrl?: string; // URL for the app logo
  connectedAt: string; // ISO date string for when the account was connected/created
  // Add any other relevant fields you want to use from Pipedream's account object
  // For example: name (user-given name for the account), updated_at, etc.
} 