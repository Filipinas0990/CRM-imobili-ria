import { supabase } from "@/integrations/supabase/client";

export async function updateLead(id: string, lead: any) {
    // Garantir que o usuário está autenticado
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: "não autenticado" };

    const user_id = authData.user.id;

    console.log("ID recebido:", id);
    console.log("DATA:", lead);
    console.log("USER_ID autenticado:", user_id);

    const { data, error } = await supabase
        .from("leads")
        .update({
            ...lead,
            user_id  // 👈 Necessário para RLS
        })
        .eq("id", id)
        .eq("user_id", user_id); // 👈 Garante que só atualiza leads do usuário

    if (error) {
        console.error("Erro no update:", error);
        return { error: error.message || error };
    }

    return { data };
}
