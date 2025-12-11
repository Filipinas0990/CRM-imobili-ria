// src/integrations/supabase/leads/createLead.ts
import { supabase } from "@/integrations/supabase/client";

export async function createLead(payload: any) {
    try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const toInsert = { ...payload, user_id: userId };

        const { data, error } = await supabase
            .from("leads")
            .insert([toInsert])
            .select()
            .single();

        if (error) {
            return { error: error.message || error };
        }

        return { data };

    } catch (err) {
        console.error("createLead unexpected:", err);
        return { error: String(err) };
    }
}
