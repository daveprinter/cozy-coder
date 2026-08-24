import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "landlord" | "caretaker" | "tenant";

const HOME_BY_ROLE: Record<AppRole, string> = {
  admin: "/admin",
  landlord: "/landlord",
  caretaker: "/caretaker",
  tenant: "/dashboard",
};

/** Roles ordered by privilege — the highest one decides the landing page. */
const PRIORITY: AppRole[] = ["admin", "landlord", "caretaker", "tenant"];

export async function fetchPrimaryRole(userId: string): Promise<AppRole> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as AppRole);
  return PRIORITY.find((r) => roles.includes(r)) ?? "tenant";
}

export function homeForRole(role: AppRole): string {
  return HOME_BY_ROLE[role] ?? "/dashboard";
}

export async function landingPathForUser(userId: string): Promise<string> {
  return homeForRole(await fetchPrimaryRole(userId));
}
