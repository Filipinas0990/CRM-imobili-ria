// src/integrations/supabase/agenda/deleteAgenda.ts
import { supabase } from "@/lib/supabaseClient";

export const deleteAgenda = async (id: string) => {
  const { data, error } = await supabase
    .from("agenda")
    .delete()
    .match({ id });

  if (error) {
    console.error("Erro ao excluir agenda:", error.message);
    return null;
  }
  return data;
};
