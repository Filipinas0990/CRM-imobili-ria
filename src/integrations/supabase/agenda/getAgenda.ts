// src/integrations/supabase/agenda/getAgenda.ts
import { supabase } from "@/lib/supabaseClient"; // ou onde você configurou o Supabase

export const getAgenda = async () => {
  const { data, error } = await supabase
    .from("agenda")
    .select("*")
    .order("date", { ascending: true }); // Ordenando pela data, por exemplo

  if (error) {
    console.error("Erro ao buscar agenda:", error.message);
    return [];
  }
  return data;
};
