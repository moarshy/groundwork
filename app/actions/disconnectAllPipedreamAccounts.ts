'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pipedream from '@/lib/pipedream';
import { revalidatePath } from 'next/cache';

interface DisconnectAllResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export async function disconnectAllPipedreamAccounts(): Promise<DisconnectAllResponse> {
  console.log("[Action] disconnectAllPipedreamAccounts started.");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('[Action] No user session found for disconnect all operation');
    return { success: false, error: 'User not authenticated' };
  }

  const externalUserId = session.user.id;
  console.log(`[Action] Attempting to delete all Pipedream accounts for external_user_id: ${externalUserId}`);

  try {
    // Assuming Pipedream SDK has a method like `deleteExternalUser` or similar
    // that takes the external_user_id to remove all associated accounts.
    console.log(`[Action] Calling pipedream.deleteExternalUser with externalUserId: ${externalUserId}`);
    // const deleteResult = await pipedream.deleteExternalUser(externalUserId);
    // console.log("[Action] pipedream.deleteExternalUser response:", deleteResult);
    
    // !!! IMPORTANT: Replace with actual Pipedream SDK call and error handling !!!
    // Forcing an error for now if the method doesn't exist or to test error path.
    if (typeof pipedream.deleteExternalUser !== 'function') {
        console.error("[Action] pipedream.deleteExternalUser is not a function! Please check Pipedream SDK setup in @/lib/pipedream.ts");
        throw new Error("Pipedream SDK method deleteExternalUser not found. This is a placeholder error.");
    }
    await pipedream.deleteExternalUser(externalUserId); // Actual call

    console.log(`[Action] Successfully initiated deletion of all accounts for external_user_id: ${externalUserId}`);
    
    console.log("[Action] Revalidating path /dashboard/connect");
    revalidatePath('/dashboard/connect');

    return { success: true, message: 'All connected accounts have been disconnected successfully.' };

  } catch (error: any) {
    console.error('[Action] Error in disconnectAllPipedreamAccounts:', error);
    // Log the full error object if possible, or specific parts
    if (error.response) {
      console.error('[Action] Pipedream API Error Response:', error.response.data);
    }
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while disconnecting all accounts.';
    return { success: false, error: errorMessage };
  }
} 