import { supabase } from "@/integrations/supabase/client";

export async function deleteImovel(id: string) {
    const { error } = await supabase
        .from("imoveis")
        .delete()
        .eq("id", id);

    return { error };
}
