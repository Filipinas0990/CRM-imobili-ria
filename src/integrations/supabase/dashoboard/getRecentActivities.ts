import { supabase } from "@/integrations/supabase/client";
export async function getRecentActivities() {
  const { data, error } = await supabase
    .from("atividades")
    .select("*")
    .order("id", { ascending: false })

    .limit(5);

  if (error) throw error;
  return data;
}
