import { supabase } from "../client";

export async function getColaboradores() {
    const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .order("criado_em", { ascending: true });

    if (error) { console.error("getColaboradores:", error); return []; }
    return data;
}