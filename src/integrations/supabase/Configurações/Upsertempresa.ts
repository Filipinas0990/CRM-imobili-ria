import { supabase } from "../client";

export async function upsertEmpresa(data: {
    id?: string;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    site?: string;
    cep?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    creci_juridico?: string;
    responsavel?: string;
    descricao?: string;
}) {
    const { error } = await supabase
        .from("empresa")
        .upsert(data, { onConflict: "id" });

    if (error) console.error("upsertEmpresa:", error);
}