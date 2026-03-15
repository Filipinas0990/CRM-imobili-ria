import { supabase } from "../client";

export async function getVendas() {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar vendas:", error);
    return [];
  }

  return data;
}
