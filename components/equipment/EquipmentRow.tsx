"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const STATUS_LABEL: Record<string, string> = {
  completed: "Hoàn thành",
  due_soon: "Sắp hết hạn",
  overdue: "Quá hạn",
  pending: "Đang chờ",
};
const STATUS_COLOR: Record<string, string> = {
  completed: "text-success",
  due_soon: "text-amber",
  overdue: "text-danger",
  pending: "text-sub",
};

const CATEGORIES = ["Xe nâng", "Bình chữa cháy", "Cân điện tử", "Chống sét", "Hệ thống PCCC", "Cửa cuốn", "Thiết bị kho"];

export default function EquipmentRow({ data, isAdmin, onChange }: { data: any; isAdmin: boolean; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    equipment_name: data.equipment_name ?? "",
    category: data.category ?? "Xe nâng",
    warehouse: data.warehouse ?? "",
    planned_inspection_date: data.planned_inspection_date ?? "",
    expiry_date: data.expiry_date ?? "",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error: eqErr } = await supabase
        .from("equipments")
        .update({
          equipment_name: form.equipment_name,
          category: form.category,
          warehouse: form.warehouse,
        })
        .eq("id", data.equipment_id);
      if (eqErr) throw eqErr;

      if (form.planned_inspection_date && form.expiry_date) {
        if (data.inspection_id) {
          const { error: insErr } = await supabase
            .from("inspections")
            .update({
              planned_inspection_date: form.planned_inspection_date,
              expiry_date: form.expiry_date,
            })
            .eq("id", data.inspection_id);
          if (insErr) throw insErr;
        } else {
          const { error: insErr } = await supabase.from("inspections").insert({
            equipment_id: data.equipment_id,
            planned_inspection_date: form.planned_inspection_date,
            expiry_date: form.expiry_date,
          });
          if (insErr) throw insErr;
        }
      }

      setEditing(false);
      onChange();
    } catch (err: any) {
      setMessage("Lỗi: " + (err.message ?? "không rõ"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Xóa thiết bị "${data.equipment_name}" (${data.equipment_code})?`)) return;
    setSaving(true);
    try {
      // Soft delete — giữ lại lịch sử, chỉ ẩn khỏi danh sách hiển thị
      const { error } = await supabase.from("equipments").update({ is_active: false }).eq("id", data.equipment_id);
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
        <div className="text-xs text-sub uppercase">{data.equipment_code} (không đổi được mã)</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tên thiết bị" value={form.equipment_name} onChange={(v) => setForm({ ...form, equipment_name: v })} />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-sub uppercase">Danh mục</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Field label="Kho" value={form.warehouse} onChange={(v) => setForm({ ...form, warehouse: v })} />
          <Field label="Ngày kiểm định dự kiến" type="date" value={form.planned_inspection_date} onChange={(v) => setForm({ ...form, planned_inspection_date: v })} />
          <Field label="Hạn kiểm định" type="date" value={form.expiry_date} onChange={(v) => setForm({ ...form, expiry_date: v })} />
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
    <div className="bg-panel border border-line rounded-md p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{data.equipment_name}</div>
        <div className="text-[11px] text-sub">{data.equipment_code} · {data.warehouse} · {data.category}</div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={`text-xs font-medium text-right ${STATUS_COLOR[data.live_status] ?? "text-sub"}`}>
          {STATUS_LABEL[data.live_status] ?? data.live_status}
          {data.remaining_days !== null && (
            <span className="block text-[11px]">
              {data.remaining_days < 0 ? `Quá ${Math.abs(data.remaining_days)} ngày` : `${data.remaining_days} ngày`}
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-accent text-xs underline">Sửa</button>
            <button onClick={handleDelete} disabled={saving} className="text-danger text-xs underline disabled:opacity-50">Xóa</button>
          </div>
        )}
      </div>
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
