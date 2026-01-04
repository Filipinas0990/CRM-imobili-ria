import { supabase } from "@/integrations/supabase/client";
import { createActivity } from "@/integrations/supabase/atividades/createAtividade";

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

        // ✅ AQUI é o lugar certo de criar a activity
        await createActivity({
            title: "Novo lead cadastrado",
            description: data.nome,
            type: "lead",
            entity: "leads",
            entity_id: data.id,
        });

        return { data };
    } catch (err) {
        console.error("createLead unexpected:", err);
        return { error: String(err) };
    }
}
