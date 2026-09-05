// Mirrors supabase/migrations/0001_init.sql
// Regenerate with: npx supabase gen types typescript --project-id <id> > types/database.ts

export type UserRole = "admin" | "user";

export type EquipmentStatus = "pending" | "due_soon" | "completed" | "overdue" | "cancelled";

export type AuditStatus = "planned" | "in_progress" | "closed" | "overdue" | "cancelled";
export type AuditPriority = "low" | "medium" | "high" | "critical";
export type FindingSeverity = "minor" | "major" | "critical";
export type FindingStatus = "open" | "in_progress" | "closed";

export type AnnouncementCategory =
  | "announcement" | "meeting" | "training" | "audit"
  | "inspection" | "safety" | "policy" | "event";
export type AnnouncementStatus = "draft" | "published" | "archived";

export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface Equipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  warehouse: string;
  location: string | null;
  manufacturer: string | null;
  vendor: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface Inspection {
  id: string;
  equipment_id: string;
  planned_inspection_date: string;
  expiry_date: string;
  inspection_vendor: string | null;
  inspector: string | null;
  is_completed: boolean;
  actual_inspection_date: string | null;
  completed_by: string | null;
  completed_at: string | null;
  status: EquipmentStatus;
}

export interface EquipmentStatusView {
  equipment_id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  warehouse: string;
  inspection_id: string | null;
  planned_inspection_date: string | null;
  expiry_date: string | null;
  is_completed: boolean | null;
  remaining_days: number | null;
  live_status: "pending" | "due_soon" | "overdue" | "completed";
}

export interface Audit {
  id: string;
  audit_code: string;
  title: string;
  audit_type: string;
  audit_date: string;
  department: string | null;
  location: string | null;
  owner_id: string | null;
  priority: AuditPriority;
  status: AuditStatus;
  description: string | null;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  finding_number: string;
  category: string | null;
  severity: FindingSeverity;
  description: string;
  corrective_action: string | null;
  action_owner_id: string | null;
  target_date: string | null;
  status: FindingStatus;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  publish_date: string;
  event_date: string | null;
  location: string | null;
  priority: AuditPriority;
  pinned: boolean;
  status: AnnouncementStatus;
  require_ack: boolean;
}

export interface NotificationSetting {
  id: string;
  module: "equipment" | "audit" | "announcement";
  label: string;
  offset_value: number;
  offset_unit: "day" | "hour" | "minute";
  is_active: boolean;
}

export interface ComplianceKpi {
  total_equipment: number;
  completed_early: number;
  completed_on_time: number;
  completed_late: number;
  pending: number;
  overdue: number;
  compliance_rate: number;
}
