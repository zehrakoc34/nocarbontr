import { createBrowserClient } from "@supabase/ssr";

// Browser (Client Component) Supabase istemcisi
// Tip güvenliği için: supabase gen types typescript --project-id <id> > src/types/supabase.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
