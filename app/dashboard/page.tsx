import { supabaseServer } from "@/lib/supabaseServer";
import type { ComplianceKpi } from "@/types/database";

// Server component: pulls the pre-computed KPI view (v_compliance_kpi) and
// equipment-status view (v_equipment_status) directly — no client round-trip.
// Port the visual layer from the design prototype
// (see /warehouse_compliance_hub.jsx delivered alongside this project)
// into components/dashboard/* and render it here with this live data.
export default async function DashboardPage() {
  const db = supabaseServer();

  const { data: kpi } = await db.from("v_compliance_kpi").select("*").single<ComplianceKpi>();
  const { data: equipment } = await db
    .from("v_equipment_status")
    .select("*")
    .neq("live_status", "completed")
    .order("remaining_days", { ascending: true })
    .limit(3);

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="font-display text-xl uppercase tracking-wide mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Compliance Rate" value={`${kpi?.compliance_rate ?? "--"}%`} />
        <KpiCard label="Đang chờ" value={kpi?.pending ?? "--"} />
        <KpiCard label="Quá hạn" value={kpi?.overdue ?? "--"} accent="text-danger" />
        <KpiCard label="Hoàn thành đúng hạn" value={kpi?.completed_on_time ?? "--"} accent="text-success" />
      </div>

      <section className="bg-panel border border-line rounded-md p-4">
        <h2 className="font-display text-xs uppercase tracking-wide text-sub mb-3">
          Top thiết bị gần hết hạn
        </h2>
        <div className="flex flex-col gap-2">
          {(equipment ?? []).map((e) => (
            <div key={e.equipment_id} className="flex justify-between text-sm">
              <span>{e.equipment_name}</span>
              <span className="text-sub">{e.remaining_days} ngày</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-panel border border-line rounded-md px-4 py-3">
      <div className="text-[11px] uppercase text-sub">{label}</div>
      <div className={`font-display text-2xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
