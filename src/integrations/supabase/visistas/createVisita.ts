import { supabase } from "@/integrations/supabase/client";
import type { CreateVisitaInput } from "./types";

export async function createVisita(visita: CreateVisitaInput) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
        return { error: "não autenticado" };
    }

    try {
        const { data, error } = await supabase
            .from("visitas")
            .insert({
                lead_id: visita.lead_id,
                imovel_id: visita.imovel_id,
                data: visita.data,
                anotacoes: visita.anotacoes ?? null,
            })
            .select()
            .single();

        if (error) return { error: error.message };
        return { data };

    } catch (err) {
        return { error: "Erro inesperado" };
    }
}
