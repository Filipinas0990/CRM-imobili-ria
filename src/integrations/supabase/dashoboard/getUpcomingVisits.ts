import { supabase } from "@/integrations/supabase/client";

export async function getUpcomingVisits() {
  const { data, error } = await supabase
    .from("agenda")
    .select("id, title, date, time, location")
    .order("date", { ascending: true })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}