import { supabase } from "@/lib/supabaseClient";
import type { Announcement } from "@/types/database";

export async function listAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("publish_date", { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

export async function markAsRead(announcementId: string, userId: string) {
  const { error } = await supabase
    .from("announcement_reads")
    .upsert({ announcement_id: announcementId, user_id: userId });
  if (error) throw error;
}

export async function getAckSummary(announcementId: string) {
  const { data, error } = await supabase
    .from("v_announcement_ack")
    .select("*")
    .eq("announcement_id", announcementId)
    .single();
  if (error) throw error;
  return data;
}
