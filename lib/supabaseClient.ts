import { createClient } from "@supabase/supabase-js";

// Browser / client-side singleton — uses the public anon key.
// Row Level Security (see supabase/migrations/0001_init.sql) enforces
// admin-vs-user permissions server-side, so the anon key is safe to ship.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
