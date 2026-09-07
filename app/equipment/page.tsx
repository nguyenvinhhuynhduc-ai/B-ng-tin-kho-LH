import { supabaseServer } from "@/lib/supabaseServer";
import AddEquipmentForm from "@/components/equipment/AddEquipmentForm";
import EquipmentList from "@/components/equipment/EquipmentList";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function EquipmentPage() {
  const db = supabaseServer();
  const { data: equipment } = await db
    .from("v_equipment_status")
    .select("*")
    .order("remaining_days", { ascending: true });

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl uppercase tracking-wide">Kiểm định thiết bị</h1>
        <a href="/dashboard" className="text-sub text-sm underline">← Dashboard</a>
      </div>

      <AddEquipmentForm />

      <EquipmentList initialEquipment={equipment ?? []} />
    </main>
  );
}
