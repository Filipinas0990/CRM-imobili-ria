import { supabase } from "@/integrations/supabase/client";

export async function getVisitas() {
    try {
        const { data, error } = await supabase
            .from("visitas")
            .select(`
                id,
                data,
                anotacoes,
                clientes (
                    id,
                    nome,
                    telefone,
                    email
                ),
                imoveis (
                    id,
                    titulo,
                    bairro,
                    cidade
                )
            `)
            .order("data", { ascending: true });

        if (error) {
            console.error("Erro ao buscar visitas:", error);
            return { error: error.message || "Erro ao buscar visitas" };
        }

        // 🔥 Formata para o padrão que o frontend usa
        const formatted = data.map((v: any) => ({
            id: v.id,
            data: v.data,
            anotacoes: v.anotacoes,
            cliente: v.clientes, // 🔄 renomeado
            imovel: v.imoveis,   // 🔄 renomeado
        }));

        return { data: formatted };

    } catch (err) {
        console.error("Erro inesperado:", err);
        return { error: "Erro inesperado ao buscar visitas" };
    }
}
