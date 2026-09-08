"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuditRow from "./AuditRow";
import AddAuditForm from "./AddAuditForm";

export default function AuditList({ initialAudits }: { initialAudits: any[] }) {
  const [audits, setAudits] = useState(initialAudits);
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
    const { data } = await supabase.from("audits").select("*").order("audit_date", { ascending: false });
    setAudits(data ?? []);
  }

  if (checking) return null;

  return (
    <>
      <AddAuditForm onCreated={refresh} />

      <section className="flex flex-col gap-2">
        {audits.map((a) => (
          <AuditRow key={a.id} data={a} isAdmin={isAdmin} onChange={refresh} />
        ))}
        {audits.length === 0 && (
          <p className="text-sub text-sm">Chưa có Audit nào. Đăng nhập Admin để tạo mới.</p>
        )}
      </section>
    </>
  );
}
