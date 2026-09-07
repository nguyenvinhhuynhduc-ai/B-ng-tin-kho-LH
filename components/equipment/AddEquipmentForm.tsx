"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddEquipmentForm() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    equipment_code: "",
    equipment_name: "",
    category: "Xe nâng",
    warehouse: "",
    location: "",
    planned_inspection_date: "",
    expiry_date: "",
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
        Bạn đang xem ở chế độ chỉ đọc. <a href="/login" className="underline text-accent">Đăng nhập Admin</a> để thêm/sửa thiết bị.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data: equipment, error: eqErr } = await supabase
        .from("equipments")
        .insert({
          equipment_code: form.equipment_code,
          equipment_name: form.equipment_name,
          category: form.category,
          warehouse: form.warehouse,
          location: form.location || null,
        })
        .select()
        .single();
      if (eqErr) throw eqErr;

      if (form.planned_inspection_date && form.expiry_date) {
        const { error: insErr } = await supabase.from("inspections").insert({
          equipment_id: equipment.id,
          planned_inspection_date: form.planned_inspection_date,
          expiry_date: form.expiry_date,
        });
        if (insErr) throw insErr;
      }

      setMessage("Đã thêm thiết bị thành công.");
      setForm({
        equipment_code: "", equipment_name: "", category: "Xe nâng",
        warehouse: "", location: "", planned_inspection_date: "", expiry_date: "",
      });
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      setMessage("Lỗi: " + (err.message ?? "không rõ"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-panel border border-line rounded-md p-4 mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-accent"
      >
        {open ? "− Đóng form" : "+ Thêm thiết bị mới"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Mã thiết bị" value={form.equipment_code} onChange={(v) => setForm({ ...form, equipment_code: v })} required />
          <Field label="Tên thiết bị" value={form.equipment_name} onChange={(v) => setForm({ ...form, equipment_name: v })} required />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-sub uppercase">Danh mục</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm"
            >
              {["Xe nâng", "Bình chữa cháy", "Cân điện tử", "Chống sét", "Hệ thống PCCC", "Cửa cuốn", "Thiết bị kho"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Field label="Kho" value={form.warehouse} onChange={(v) => setForm({ ...form, warehouse: v })} required />
          <Field label="Vị trí" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label="Ngày kiểm định dự kiến" type="date" value={form.planned_inspection_date} onChange={(v) => setForm({ ...form, planned_inspection_date: v })} />
          <Field label="Hạn kiểm định" type="date" value={form.expiry_date} onChange={(v) => setForm({ ...form, expiry_date: v })} />

          <div className="sm:col-span-2 flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-white rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu thiết bị"}
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
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm"
      />
    </div>
  );
}
