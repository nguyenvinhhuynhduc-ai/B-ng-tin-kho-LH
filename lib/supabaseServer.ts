import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key — bypasses RLS.
// Use exclusively inside API routes / Netlify Functions, never in client code.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
