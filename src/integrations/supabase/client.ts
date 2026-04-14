import { createClient, SupabaseClient } from "@supabase/supabase-js";

let instance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (instance) return instance;

  instance = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  return instance;
}

export const supabase = getSupabaseClient();