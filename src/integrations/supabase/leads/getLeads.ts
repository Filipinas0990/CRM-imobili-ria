import { supabase } from "@/integrations/supabase/client";

export async function getLeads() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const user_id = authData.user.id;

    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user_id);

    if (error) return [];

    return data; // <-- VOLTA A RETORNAR APENAS O ARRAY
}
