import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  console.error("❌ VITE_SUPABASE_URL não encontrada!");
}
if (!supabaseKey) {
  console.error("❌ VITE_SUPABASE_ANON_KEY não encontrada!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
