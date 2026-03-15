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
    const { error } = await supabase.from("colaboradores").insert(data);
    if (error) console.error("createColaborador:", error);
}