import { supabase } from "@/integrations/supabase/client";

export async function deleteLead(id: string) {
    const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir lead:", error);
        return false;
    }

    return true;
}
