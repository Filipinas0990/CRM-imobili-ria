import { supabase } from "@/integrations/supabase/client";
import type { UpdateVisitaInput } from "./types";

export async function updateVisita(id: string, visita: UpdateVisitaInput) {
    const { data, error } = await supabase
        .from("visitas")
        .update({
            lead_id: visita.lead_id,
            imovel_id: visita.imovel_id,
            data: visita.data,
            anotacoes: visita.anotacoes,
        })
        .eq("id", id)
        .select()
        .single();

    return { data, error };
}
