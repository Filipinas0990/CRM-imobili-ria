import { supabase } from "@/integrations/supabase/client";

export async function getUpcomingVisits() {
  const { data, error } = await supabase
    .from("agenda")
    .select("*")
    .limit(5);

  console.log("VISITS:", data, error); // 👈 ADICIONE ISSO

  if (error) throw error;
  return data ?? [];
}

