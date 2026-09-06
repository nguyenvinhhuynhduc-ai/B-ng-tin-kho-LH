import { supabase } from "@/lib/supabaseClient";
import type { AppUser } from "@/types/database";

export async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (error) return null;
  return data as AppUser;
}

export function isAdmin(user: AppUser | null) {
  return user?.role === "admin";
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
