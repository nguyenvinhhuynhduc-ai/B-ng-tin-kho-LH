import { supabase } from "@/lib/supabaseClient";
import type { Equipment, EquipmentStatusView, Inspection } from "@/types/database";

export async function listEquipmentStatus(): Promise<EquipmentStatusView[]> {
  const { data, error } = await supabase.from("v_equipment_status").select("*");
  if (error) throw error;
  return data as EquipmentStatusView[];
}

export async function createEquipment(payload: Partial<Equipment>) {
  const { data, error } = await supabase.from("equipments").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateEquipment(id: string, payload: Partial<Equipment>) {
  const { data, error } = await supabase.from("equipments").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase.from("equipments").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function upsertInspection(payload: Partial<Inspection>) {
  const { data, error } = await supabase.from("inspections").upsert(payload).select().single();
  if (error) throw error;
  return data;
}

// Admin ticks "☑ Hoàn thành kiểm định" — DB trigger stamps actual date/time/user.
export async function completeInspection(inspectionId: string, userId: string) {
  const { data, error } = await supabase
    .from("inspections")
    .update({ is_completed: true, completed_by: userId })
    .eq("id", inspectionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
