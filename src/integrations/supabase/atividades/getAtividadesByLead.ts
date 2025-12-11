
// src/integrations/supabase/atividades/getAtividadesByLead.ts
import { supabase } from "@/integrations/supabase/client";

export async function getAtividadesByLead(leadId: string) {
    try {
        const { data, error } = await supabase
            .from("atividades")
            .select("*")
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false });

        if (error) return { error: error.message || error };
        return { data };
    } catch (err) {
        console.error("getAtividadesByLead unexpected:", err);
        return { error: String(err) };
    }
}
