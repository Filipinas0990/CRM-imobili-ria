import { supabase } from "../client";

export async function createColaborador(data: {
    nome: string;
    email: string;
    telefone?: string;
    cargo: string;
    creci?: string;
    comissao: number;
    status: string;
}) {
    const { data: { user } } = await supabase.auth.getUser(); // 👈 pega o usuário logado

    const { error } = await supabase.from("colaboradores").insert({
        ...data,
        user_id: user?.id, // 👈 vincula ao dono
    });
    if (error) console.error("createColaborador:", error);
}