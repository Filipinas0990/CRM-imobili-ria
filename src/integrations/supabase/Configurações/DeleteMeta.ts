import { supabase } from "../client";

export async function deleteMeta(id: string) {
    const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", id);

    if (error) console.error("deleteMeta:", error);
}