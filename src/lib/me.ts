import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Me = {
  id: string;
  email: string | undefined;
  fullName: string;
  status: "new" | "pending" | "verified" | "suspended";
  isSenior: boolean;
  roles: string[];
};

// One lookup per request, shared by layout and pages.
export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,status,is_senior_member")
    .eq("id", user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).flatMap((r) => {
    const rel = r.roles as unknown as { name: string } | { name: string }[] | null;
    return rel ? (Array.isArray(rel) ? rel.map((x) => x.name) : [rel.name]) : [];
  });

  return {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? "Member",
    status: (profile?.status as Me["status"]) ?? "new",
    isSenior: profile?.is_senior_member ?? false,
    roles,
  };
});
