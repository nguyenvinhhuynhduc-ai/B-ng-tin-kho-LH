"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EquipmentRow from "./EquipmentRow";

export default function EquipmentList({ initialEquipment }: { initialEquipment: any[] }) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
      setIsAdmin(data?.role === "admin");
      setChecking(false);
    })();
  }, []);

  async function refresh() {
    const { data } = await supabase
      .from("v_equipment_status")
      .select("*")
      .order("remaining_days", { ascending: true });
    setEquipment(data ?? []);
  }

  if (checking) return null;

  return (
    <section className="mt-6 flex flex-col gap-2">
      {equipment.map((e) => (
        <EquipmentRow key={e.equipment_id} data={e} isAdmin={isAdmin} onChange={refresh} />
      ))}
      {equipment.length === 0 && (
        <p className="text-sub text-sm">Chưa có thiết bị nào. Đăng nhập Admin để thêm mới.</p>
      )}
    </section>
  );
}
