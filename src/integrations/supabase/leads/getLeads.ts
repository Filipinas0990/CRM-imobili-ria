import { supabase } from "@/integrations/supabase/client";

export async function getLeads() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const { data, error } = await supabase
        .from("leads")
        .select("id, nome, email, telefone, status, temperatura, interesse, observacoes, origem, criado_em")
        .eq("user_id", authData.user.id)
        .order("criado_em", { ascending: false }); 

    if (error) return [];
    return data;
}