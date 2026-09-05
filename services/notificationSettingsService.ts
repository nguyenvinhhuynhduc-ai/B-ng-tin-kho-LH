import { supabase } from "@/lib/supabaseClient";
import type { NotificationSetting } from "@/types/database";

// Admin-configurable thresholds — never hard-code day counts in the app.
export async function listNotificationSettings(module: NotificationSetting["module"]) {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("module", module)
    .order("offset_value", { ascending: false });
  if (error) throw error;
  return data as NotificationSetting[];
}

export async function addThreshold(payload: Partial<NotificationSetting>) {
  const { data, error } = await supabase.from("notification_settings").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function toggleThreshold(id: string, is_active: boolean) {
  const { error } = await supabase.from("notification_settings").update({ is_active }).eq("id", id);
  if (error) throw error;
}

export async function deleteThreshold(id: string) {
  const { error } = await supabase.from("notification_settings").delete().eq("id", id);
  if (error) throw error;
}
