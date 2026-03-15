import { supabase } from "@/integrations/supabase/client";

interface CreateLancamentoProps {
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipo: "entrada" | "saida";
}

export async function createLancamento(data: CreateLancamentoProps) {
  const { error } = await supabase
    .from("financeiro")
    .insert([data]);

  if (error) throw error;
}
