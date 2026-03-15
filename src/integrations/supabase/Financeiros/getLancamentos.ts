import { supabase } from "@/integrations/supabase/client";

export async function getLancamentos() {
  const { data, error } = await supabase
    .from("financeiro")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw error;
  return data;
}
