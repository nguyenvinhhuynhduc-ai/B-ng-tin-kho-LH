"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const TYPES = ["Internal Audit", "Customer Audit", "ISO Audit", "Safety Audit", "Warehouse Audit"];
const PRIORITIES = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "critical", label: "Khẩn cấp" },
];

export default function AddAuditForm({ onCreated }: { onCreated: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    audit_code: "",
    title: "",
    audit_type: TYPES[0],
    audit_date: "",
    department: "",
    location: "",
    priority: "medium",
    description: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
      setIsAdmin(data?.role === "admin");
      setChecking(false);
    })();
  }, []);

  if (checking) return null;
  if (!isAdmin) {
    return (
      <p className="text-sub text-xs mb-4">
        Bạn đang xem ở chế độ chỉ đọc. <a href="/login" className="underline text-accent">Đăng nhập Admin</a> để tạo/sửa Audit.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.from("audits").insert({
        audit_code: form.audit_code,
        title: form.title,
        audit_type: form.audit_type,
        audit_date: form.audit_date,
        department: form.department || null,
        location: form.location || null,
        priority: form.priority,
        description: form.description || null,
      });
      if (error) throw error;

      setMessage("Đã tạo Audit thành công.");
      setForm({ audit_code: "", title: "", audit_type: TYPES[0], audit_date: "", department: "", location: "", priority: "medium", description: "" });
      onCreated();
    } catch (err: any) {
      setMessage("Lỗi: " + (err.message ?? "không rõ"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-panel border border-line rounded-md p-4 mb-6">
      <button onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-accent">
        {open ? "− Đóng form" : "+ Tạo Audit mới"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Mã Audit" value={form.audit_code} onChange={(v) => setForm({ ...form, audit_code: v })} required />
          <Field label="Tiêu đề" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-sub uppercase">Loại Audit</label>
            <select value={form.audit_type} onChange={(e) => setForm({ ...form, audit_type: e.target.value })} className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <Field label="Ngày Audit" type="date" value={form.audit_date} onChange={(v) => setForm({ ...form, audit_date: v })} required />
          <Field label="Phòng ban" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Field label="Địa điểm" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-sub uppercase">Mức độ</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm">
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs text-sub uppercase">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm" rows={2} />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3 mt-2">
            <button type="submit" disabled={saving} className="bg-accent text-white rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-50">
              {saving ? "Đang lưu..." : "Tạo Audit"}
            </button>
            {message && <span className="text-xs text-sub">{message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-sub uppercase">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm" />
    </div>
  );
}
