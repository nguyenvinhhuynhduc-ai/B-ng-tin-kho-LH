import { supabaseServer } from "@/lib/supabaseServer";
import AuditList from "@/components/audits/AuditList";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AuditsPage() {
  const db = supabaseServer();
  const { data: audits } = await db.from("audits").select("*").order("audit_date", { ascending: false });

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl uppercase tracking-wide">Audit / Thanh tra</h1>
        <a href="/dashboard" className="text-sub text-sm underline">← Dashboard</a>
      </div>

      <AuditList initialAudits={audits ?? []} />
    </main>
  );
}
