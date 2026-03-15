import { supabase } from "../client";

export async function deleteTarefa(tarefaId: string) {
    const { error } = await supabase
        .from("tarefas")
        .delete()
        .eq("id", tarefaId);

    if (error) {
        console.error("Erro ao deletar tarefa:", error);
        throw error;
    }
}
