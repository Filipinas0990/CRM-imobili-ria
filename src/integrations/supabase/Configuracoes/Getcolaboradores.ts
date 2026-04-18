import { supabase } from "../client";

export async function getColaboradores() {
    const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .order("criado_em", { ascending: true });
        // O RLS já filtra por user_id automaticamente ✅

    if (error) { console.error("getColaboradores:", error); return []; }
    return data;
}