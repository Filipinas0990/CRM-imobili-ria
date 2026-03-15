import { supabase } from "@/integrations/supabase/client";

export async function updateVendaStatus(
    vendaId: string,
    status: "Fechada" | "Perdida"
) {
    const { error } = await supabase
        .from("vendas")
        .update({ status })
        .eq("id", vendaId);

    if (error) {
        console.error("Erro ao atualizar status:", error);
        throw error;
    }
}
