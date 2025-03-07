import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user's ID from the Supabase auth
 * @returns The user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

/**
 * Adds the current user's ID to an object if not already present
 * @param data The data object to add user_id to
 * @returns The data object with user_id added
 */
export async function addUserIdToData<T extends Record<string, any>>(data: T): Promise<T & { user_id: string }> {
  if (data.user_id) {
    return data as T & { user_id: string };
  }
  
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User is not authenticated");
  }
  
  return {
    ...data,
    user_id: userId
  };
} 