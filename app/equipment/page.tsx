import { supabaseServer } from "@/lib/supabaseServer";
import AddEquipmentForm from "@/components/equipment/AddEquipmentForm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function EquipmentPage() {
  const db = supabaseServer();
  const { data: equipment } = await db
    .from("v_equipment_status")
    .select("*")
    .order("remaining_days", { ascending: true });

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

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl uppercase tracking-wide">Kiểm định thiết bị</h1>
        <a href="/dashboard" className="text-sub text-sm underline">← Dashboard</a>
      </div>

      {/* Chỉ hiện với người đã đăng nhập Admin — tự kiểm tra session ở client */}
      <AddEquipmentForm />

      <section className="mt-6 flex flex-col gap-2">
        {(equipment ?? []).map((e) => (
          <div key={e.equipment_id} className="bg-panel border border-line rounded-md p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{e.equipment_name}</div>
              <div className="text-[11px] text-sub">{e.equipment_code} · {e.warehouse} · {e.category}</div>
            </div>
            <div className={`text-xs font-medium ${STATUS_COLOR[e.live_status] ?? "text-sub"}`}>
              {STATUS_LABEL[e.live_status] ?? e.live_status}
              {e.remaining_days !== null && (
                <span className="block text-right text-[11px]">
                  {e.remaining_days < 0 ? `Quá ${Math.abs(e.remaining_days)} ngày` : `${e.remaining_days} ngày`}
                </span>
              )}
            </div>
          </div>
        ))}
        {(!equipment || equipment.length === 0) && (
          <p className="text-sub text-sm">Chưa có thiết bị nào. {"\n"}Đăng nhập Admin để thêm mới.</p>
        )}
      </section>
    </main>
  );
}
