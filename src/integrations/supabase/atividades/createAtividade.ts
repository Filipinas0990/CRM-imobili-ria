// src/integrations/supabase/atividades/createAtividade.ts
import { supabase } from "@/integrations/supabase/client";

type Payload = {
    lead_id: string;
    tipo?: string;
    status?: string;
    titulo?: string;
    descricao: string;
    next_follow_up?: string | null;
};

export async function createAtividade(payload: Payload) {
    try {
        const { data, error } = await supabase
            .from("atividades")
            .insert([payload])
            .select()
            .single();

        if (error) return { error: error.message || error };
        return { data };
    } catch (err) {
        console.error("createAtividade unexpected:", err);
        return { error: String(err) };
    }
}
