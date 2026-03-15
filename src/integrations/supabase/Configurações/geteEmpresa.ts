import { supabase } from "../client";

export async function getEmpresa() {
    const { data, error } = await supabase
        .from("empresa")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (error) { console.error("getEmpresa:", error); return null; }
    return data;
}