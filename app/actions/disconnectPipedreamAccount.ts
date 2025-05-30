'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pipedream from '@/lib/pipedream';
import { revalidatePath } from 'next/cache';

interface DisconnectParams {
  pipedreamAccountId: string;
}

interface DisconnectResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export async function disconnectPipedreamAccount(
  params: DisconnectParams
): Promise<DisconnectResponse> {
  console.log("[Action] disconnectPipedreamAccount started.");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('[Action] No user session found for disconnectPipedreamAccount operation');
    return { success: false, error: 'User not authenticated' };
  }

  const { pipedreamAccountId } = params;
  if (!pipedreamAccountId) {
    console.error('[Action] Pipedream Account ID is required for disconnectPipedreamAccount.');
    return { success: false, error: 'Pipedream Account ID is required' };
  }

  console.log(`[Action] Attempting to delete Pipedream account ID: ${pipedreamAccountId} for user ${session.user.id}`);

  try {
    console.log(`[Action] Calling pipedream.deleteAccount with accountId: ${pipedreamAccountId}`);
    // !!! IMPORTANT: Ensure pipedream.deleteAccount is the correct SDK method !!!
    if (typeof pipedream.deleteAccount !== 'function') {
        console.error("[Action] pipedream.deleteAccount is not a function! Please check Pipedream SDK setup in @/lib/pipedream.ts");
        throw new Error("Pipedream SDK method deleteAccount not found. This is a placeholder error.");
    }
    await pipedream.deleteAccount(pipedreamAccountId); // Actual call

    console.log(`[Action] Successfully deleted Pipedream account ID: ${pipedreamAccountId}`);
    
    console.log("[Action] Revalidating path /dashboard/connect for individual disconnect.");
    revalidatePath('/dashboard/connect');

    return { success: true, message: 'Account disconnected successfully.' };

  } catch (error: any) {
    console.error('[Action] Error in disconnectPipedreamAccount:', error);
    if (error.response) {
      console.error('[Action] Pipedream API Error Response for deleteAccount:', error.response.data);
    }
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return { success: false, error: errorMessage };
  }
} 