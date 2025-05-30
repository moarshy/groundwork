"use server";

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pipedream from '@/lib/pipedream';
import { PipedreamConnectedAccount } from '@/types/pipedream'; // We will create this type

export async function getConnectedAccounts(): Promise<PipedreamConnectedAccount[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('No user session found');
    return [];
  }

  const externalUserId = session.user.id;

  try {
    const response = await pipedream.getAccounts({
      external_user_id: externalUserId,
      // include_credentials: true, // Optional: if you need credentials, but be careful
    });

    if (response && Array.isArray(response.data)) {
        // Adapt this mapping to the actual structure of Pipedream accounts
        return response.data.map((acc: any) => ({
          id: acc.id, // Pipedream's account ID
          app: acc.app?.name || 'Unknown App',
          appNameSlug: acc.app?.name_slug || acc.app?.id || 'unknown-app',
          externalId: acc.external_id, // This should match our session.user.id
          healthy: acc.healthy,
          logoUrl: acc.app?.img_src, // Assuming img_src is available
          connectedAt: acc.created_at, // or updated_at
        }));
    } else {
        console.error('Failed to fetch connected accounts or unexpected response structure:', response);
        return [];
    }

  } catch (error) {
    console.error('Error fetching Pipedream connected accounts:', error);
    return [];
  }
}