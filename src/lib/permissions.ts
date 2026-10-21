import { createClient } from "@/lib/supabase/server";

// Asks the database whether the signed-in user holds a permission (Super Admin holds all).
export async function can(permission: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("has_permission", { p: permission });
  return !error && data === true;
}
