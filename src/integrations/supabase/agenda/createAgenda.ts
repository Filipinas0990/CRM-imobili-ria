import { supabase } from "@/lib/supabaseClient";

type CreateAgendaParams = {
  title: string;
  date: string;
  time: string;
  location: string;
};

export async function createAgenda({
  title,
  date,
  time,
  location,
}: CreateAgendaParams) {
  if (!date) {
    throw new Error("Data é obrigatória");
  }

  const { data, error } = await supabase
    .from("agenda")
    .insert([{ title, date, time, location }])
    .select();

  if (error) throw error;

  return data;
}
