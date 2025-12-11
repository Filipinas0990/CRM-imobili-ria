// integrations/supabase/clientes/updateCliente.ts
import { supabase } from "@/integrations/supabase/client";

export async function updateCliente(id: string, dados: {
    nome?: string;
    email?: string;
    telefone?: string;
}) {
    try {
        const { data, error } = await supabase
            .from("clientes")
            .update(dados)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (err: any) {
        console.error("Erro ao atualizar cliente:", err.message || err);
        throw new Error("Erro ao atualizar cliente.");
    }
}
