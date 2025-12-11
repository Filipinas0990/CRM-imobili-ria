// src/integrations/supabase/atividades/deleteAtividade.ts
import { supabase } from "@/integrations/supabase/client";

export async function deleteAtividade(id: string) {
    try {
        const { error } = await supabase
            .from("atividades")
            .delete()
            .eq("id", id);

        if (error) return { error: error.message || error };
        return { success: true };
    } catch (err) {
        console.error("deleteAtividade unexpected:", err);
        return { error: String(err) };
    }
}
