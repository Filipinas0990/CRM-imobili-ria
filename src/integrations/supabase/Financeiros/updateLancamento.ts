import { supabase } from "@/integrations/supabase/client";


export async function updateLancamento(
  id: number,
  updates: Partial<{
    descricao: string;
    valor: number;
    data: string;
    categoria: string;
    tipo: "entrada" | "saida";
  }>
) {
  const { error } = await supabase
    .from("financeiro")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}
