import { supabase } from "@/integrations/supabase/client";

export async function deleteVenda(id: string) {
    const { error } = await supabase
        .from("vendas")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao deletar venda:", error);
        throw error;
    }
}
