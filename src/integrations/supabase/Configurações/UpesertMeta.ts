import { supabase } from "../client";

export async function upsertMeta(data: {
    id?: string;
    periodo: string;
    meta_valor: number;
    meta_vendas: number;
    meta_leads: number;
}) {
    const { error } = await supabase
        .from("metas")
        .upsert(data, { onConflict: "id" });

    if (error) console.error("upsertMeta:", error);
}