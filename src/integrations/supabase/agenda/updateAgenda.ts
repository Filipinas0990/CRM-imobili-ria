import { supabase } from "@/lib/supabaseClient";

type UpdateAgendaParams = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
};

export async function updateAgenda({
  id,
  title,
  date,
  time,
  location,
}: UpdateAgendaParams) {
  const { data, error } = await supabase
    .from("agenda")
    .update({
      title,
      date,
      time,
      location,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Erro ao atualizar evento:", error);
    throw error;
  }

  return data;
}
