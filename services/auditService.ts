import { supabase } from "@/lib/supabaseClient";
import type { Audit, AuditFinding } from "@/types/database";

export async function listAudits() {
  const { data, error } = await supabase.from("audits").select("*").order("audit_date", { ascending: false });
  if (error) throw error;
  return data as Audit[];
}

export async function createAudit(payload: Partial<Audit>) {
  const { data, error } = await supabase.from("audits").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function listFindings(auditId: string) {
  const { data, error } = await supabase.from("audit_findings").select("*").eq("audit_id", auditId);
  if (error) throw error;
  return data as AuditFinding[];
}
