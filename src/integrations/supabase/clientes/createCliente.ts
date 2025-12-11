// src/integrations/supabase/clientes/createCliente.ts
import { supabase } from "@/integrations/supabase/client";

export async function createCliente({ nome, email, telefone, compra }: {
    nome: string;
    email: string;
    telefone?: string;
    compra?: string;
}) {
    try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
            console.error("Erro ao obter usuário:", authError);
            return { error: authError };
        }

        const userId = authData.user.id;

        const { data, error } = await supabase
            .from("clientes")
            .insert([
                {
                    nome,
                    email,
                    telefone: telefone || null,
                    compra: compra || null,
                    user_id: userId,
                },
            ]);

        if (error) {
            console.error("Erro ao criar cliente:", error);
            return { error };
        }

        return { data };
    } catch (err) {
        console.error("Erro inesperado ao criar cliente:", err);
        return { error: err };
    }
}
