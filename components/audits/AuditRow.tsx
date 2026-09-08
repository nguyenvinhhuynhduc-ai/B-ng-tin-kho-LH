"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const TYPES = ["Internal Audit", "Customer Audit", "ISO Audit", "Safety Audit", "Warehouse Audit"];
const STATUSES = ["planned", "in_progress", "closed", "overdue", "cancelled"];
const PRIORITIES = ["low", "medium", "high", "critical"];

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned", in_progress: "In Progress", closed: "Closed", overdue: "Overdue", cancelled: "Cancelled",
};
const STATUS_COLOR: Record<string, string> = {
  planned: "text-accent", in_progress: "text-amber", closed: "text-success", overdue: "text-danger", cancelled: "text-sub",
};
const PRIORITY_LABEL: Record<string, string> = { low: "Thấp", medium: "Trung bình", high: "Cao", critical: "Khẩn cấp" };

export default function AuditRow({ data, isAdmin, onChange }: { data: any; isAdmin: boolean; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: data.title ?? "",
    audit_type: data.audit_type ?? TYPES[0],
    audit_date: data.audit_date ?? "",
    department: data.department ?? "",
    location: data.location ?? "",
    priority: data.priority ?? "medium",
    status: data.status ?? "planned",
    description: data.description ?? "",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("audits").update(form).eq("id", data.id);
      if (error) throw error;
      setEditing(false);
      onChange();
    } catch (err: any) {
      setMessage("Lỗi: " + (err.message ?? "không rõ"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Xóa audit "${data.title}" (${data.audit_code})?`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("audits").delete().eq("id", data.id);
      if (error) throw error;
      onChange();
    } catch (err: any) {
      alert("Lỗi khi xóa: " + (err.message ?? "không rõ"));
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="bg-panel border border-line rounded-md p-3 flex flex-col gap-3">
        <div className="text-xs text-sub uppercase">{data.audit_code} (không đổi được mã)</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tiêu đề" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />

          <Select label="Loại Audit" value={form.audit_type} options={TYPES} onChange={(v) => setForm({ ...form, audit_type: v })} />
          <Field label="Ngày Audit" type="date" value={form.audit_date} onChange={(v) => setForm({ ...form, audit_date: v })} />
          <Field label="Phòng ban" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Field label="Địa điểm" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />

          <Select label="Mức độ" value={form.priority} options={PRIORITIES} labels={PRIORITY_LABEL} onChange={(v) => setForm({ ...form, priority: v })} />
          <Select label="Trạng thái" value={form.status} options={STATUSES} labels={STATUS_LABEL} onChange={(v) => setForm({ ...form, status: v })} />

          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs text-sub uppercase">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>

        {message && <p className="text-danger text-xs">{message}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-accent text-white rounded-sm px-3 py-1.5 text-xs font-medium disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-sub text-xs px-3 py-1.5">
            Hủy
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-panel border border-line rounded-md p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-sub">{data.audit_code} · {data.audit_type}</span>
        <span className={`text-xs font-medium ${STATUS_COLOR[data.status] ?? "text-sub"}`}>
          {STATUS_LABEL[data.status] ?? data.status}
        </span>
      </div>
      <div className="text-sm font-medium mt-1">{data.title}</div>
      <div className="text-[11px] text-sub mt-1">
        {data.audit_date} · {data.department || "—"} · Mức độ: {PRIORITY_LABEL[data.priority] ?? data.priority}
      </div>

      {isAdmin && (
        <div className="flex gap-3 mt-2">
          <button onClick={() => setEditing(true)} className="text-accent text-xs underline">Sửa</button>
          <button onClick={handleDelete} disabled={saving} className="text-danger text-xs underline disabled:opacity-50">Xóa</button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-sub uppercase">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm"
      />
    </div>
  );
}

function Select({ label, value, options, labels, onChange }: {
  label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-sub uppercase">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm">
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </div>
  );
}
