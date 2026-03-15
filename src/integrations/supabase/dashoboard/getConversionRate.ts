import { supabase } from "@/integrations/supabase/client";


export async function getConversionRate() {
  // Total de leads
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });

  if (!totalLeads || totalLeads === 0) {
    return 0;
  }

  // Total de visitas agendadas
  const { count: totalVisits } = await supabase
    .from("agenda")
    .select("id", { count: "exact", head: true });

  if (!totalVisits) {
    return 0;
  }

  const rate = (totalVisits / totalLeads) * 100;

  return Number.isFinite(rate) ? Math.round(rate) : 0;
}
