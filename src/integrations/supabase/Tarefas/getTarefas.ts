import { supabase } from "../client";

export async function getTarefas() {
    const { data, error } = await supabase
        .from("tarefas")
        .select("*")
        .order("data_inicio", { ascending: true });

    if (error) {
        console.error("Erro ao buscar tarefas:", error);
        throw error;
    }

    return data;
}
