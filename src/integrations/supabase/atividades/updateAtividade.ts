// src/integrations/supabase/atividades/updateAtividade.ts
import { supabase } from "@/integrations/supabase/client";

export async function updateAtividade(id: string, payload: any) {
    try {
        const { data, error } = await supabase
            .from("atividades")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) return { error: error.message || error };
        return { data };
    } catch (err) {
        console.error("updateAtividade unexpected:", err);
        return { error: String(err) };
    }
}
