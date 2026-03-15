import { supabase } from "@/integrations/supabase/client";
import { getConversionRate } from "./getConversionRate";

export async function getDashboardStats() {
  const [{ count: leads }, { count: imoveis }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("imoveis").select("*", { count: "exact", head: true }),
  ]);

  const conversionRate = await getConversionRate();

  return {
    totalLeads: leads ?? 0,
    totalProperties: imoveis ?? 0,
    conversionRate, // 👈 novo dado
  };
}
