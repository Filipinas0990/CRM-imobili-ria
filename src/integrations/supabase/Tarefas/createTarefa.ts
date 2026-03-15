import { supabase } from "../client";

type CreateTarefaProps = {
    lead_id?: string | null;
    tipo: "chamada" | "reuniao" | "tarefa" | "email" | "prazo";
    titulo: string;
    descricao?: string;
    data_inicio: string;
    data_fim?: string;
    prioridade?: "baixa" | "normal" | "alta";
};

export async function createTarefa({
    lead_id = null,
    tipo,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    prioridade = "normal",
}: CreateTarefaProps) {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Usuário não autenticado");
    }

    const { error } = await supabase.from("tarefas").insert({
        lead_id,
        user_id: user.id,
        tipo,
        titulo,
        descricao,
        data_inicio,
        data_fim,
        prioridade,
        status: "pendente",
    });

    if (error) {
        console.error("Erro ao criar tarefa:", error);
        throw error;
    }
}
