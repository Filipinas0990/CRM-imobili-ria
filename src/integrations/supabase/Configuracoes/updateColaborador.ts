import { supabase } from "../client";

export async function updateColaborador(id: string, data: Partial<{
    nome: string;
    email: string;
    telefone: string;
    cargo: string;
    creci: string;
    comissao: number;
    status: string;
}>) {
    const { error } = await supabase.from("colaboradores").update(data).eq("id", id);
    if (error) console.error("updateColaborador:", error);
}