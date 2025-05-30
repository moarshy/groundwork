'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pipedream from '@/lib/pipedream';

interface GenerateConnectUrlParams {
  appSlug: string; // The slug of the Pipedream app to connect (e.g., 'google_sheets', 'slack')
  // oauthAppId?: string; // Optional: If you are using your own OAuth app configured in Pipedream
}

interface ConnectUrlResponse {
  connectUrl?: string;
  error?: string;
}

export async function generatePipedreamConnectUrl(
  params: GenerateConnectUrlParams
): Promise<ConnectUrlResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('No user session found');
    return { error: 'User not authenticated' };
  }

  const externalUserId = session.user.id;
  const { appSlug } = params;

  try {
    const allowedOrigins = process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : [];
    if (process.env.NODE_ENV === 'development' && !allowedOrigins.find(o => o.startsWith('http://localhost'))) {
      allowedOrigins.push('http://localhost:3000'); // Common Next.js dev port
    }

    if (allowedOrigins.length === 0) {
      console.error('No allowed_origins configured for Pipedream connect token. NEXTAUTH_URL might be missing.');
      return { error: 'Server configuration error: allowed origins not set.' };
    }

    const tokenResponse = await pipedream.createConnectToken({
      external_user_id: externalUserId,
      allowed_origins: allowedOrigins,
      // You might want to add success_redirect_uri and error_redirect_uri here
      // to redirect the user back to your app after connecting/failing in Pipedream.
      // For example:
      // success_redirect_uri: `${process.env.NEXTAUTH_URL}/dashboard/connect?status=success`,
      // error_redirect_uri: `${process.env.NEXTAUTH_URL}/dashboard/connect?status=error`,
    });

    if (tokenResponse?.token && tokenResponse?.connect_link_url) {
      // The connect_link_url already includes the token and app selection, but if you need to construct it manually for specific apps:
      // The general idea for Pipedream Connect Link is to redirect the user to a URL like:
      // https://pipedream.com/auth/connect?token=<TOKEN>&app=<APP_SLUG_OR_ID>
      // However, createConnectToken often provides a direct connect_link_url which might be preferred.
      // Let's assume connect_link_url is sufficient. If we need to specify the appSlug explicitly,
      // we might need to adjust. The documentation for createConnectToken implies connect_link_url
      // is the primary way.

      // If connect_link_url doesn't inherently know which app to connect, or if you want to pre-select it:
      // A more specific URL might be needed, often by appending parameters to connect_link_url
      // or by using a different Pipedream SDK method if available for app-specific connect links.
      // For now, we assume `tokenResponse.connect_link_url` is generic and we might need to append `app` query param.
      // OR, we use a different Pipedream function if connect_link_url is for a generic connection portal.

      // Let's test if connect_link_url directly supports the app or if we need to append it.
      // Typically, the Pipedream SDK and connect tokens are designed for a flow where
      // the user selects the app on the Pipedream side if not specified.
      // If we want to direct them to a specific app connection, the `connect_link_url` should ideally handle it
      // or we modify it. Let's assume for now the `appSlug` is part of the properties of the Pipedream client (`pd`)
      // or the `createConnectToken` call itself if that's how their SDK works for targeted connections.
      
      // The Pipedream docs for `createFrontendClient().connectAccount({ app: appSlug, token })` suggest
      // the token is primary and `app` is specified client-side.
      // For a server-generated URL to redirect to, we expect `connect_link_url` to be usable.
      // If `connect_link_url` from `createConnectToken` is a generic portal, we might need to append `&app=${appSlug}`.
      // Let's try to use it as is first.

      // A common pattern is `connect_link_url` is the base and you add `&app=app_slug`
      // The Pipedream documentation for `createConnectToken` response has: 
      // connect_link_url: // The URL to redirect the user to for the Connect Link flow
      // This URL likely takes the user to a Pipedream page where they can choose an app if not pre-selected.
      // To pre-select, we often append `&app={app_slug}` to this URL.

      let finalConnectUrl = tokenResponse.connect_link_url;
      // Check if appSlug needs to be appended. 
      // Some Pipedream connect_link_urls might already be app-specific if configured that way via an OAuth App ID in Pipedream.
      // If it's a generic connect_link_url, we append the appSlug.
      if (appSlug && finalConnectUrl && !finalConnectUrl.includes('app=')) {
        const separator = finalConnectUrl.includes('?') ? '&' : '?';
        finalConnectUrl += `${separator}app=${encodeURIComponent(appSlug)}`;
      }
      
      return { connectUrl: finalConnectUrl };

    } else {
      console.error('Failed to generate Pipedream connect token or URL:', tokenResponse);
      return { error: 'Could not generate connect URL.' };
    }
  } catch (error: any) {
    console.error('Error generating Pipedream connect URL:', error);
    return { error: error.message || 'An unexpected error occurred.' };
  }
} 