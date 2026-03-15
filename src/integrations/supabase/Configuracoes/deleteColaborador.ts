import { supabase } from "../client";

export async function deleteColaborador(id: string) {
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) console.error("deleteColaborador:", error);
}