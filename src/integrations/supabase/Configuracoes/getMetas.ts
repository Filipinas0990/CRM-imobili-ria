import { supabase } from "../client";

export async function getMetas() {
    const { data, error } = await supabase
        .from("metas")
        .select("*")
        .order("periodo", { ascending: false });

    if (error) { console.error("getMetas:", error); return []; }
    return data;
}