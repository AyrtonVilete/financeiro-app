import { createBrowserClient } from "@supabase/ssr";

// Sem tipos gerados do schema ainda. Depois de criar o projeto Supabase, rode:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
// e troque para createBrowserClient<Database>(...) para ganhar autocomplete/type-safety nas queries.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
