import { supabase } from "@/integrations/supabase/client";

export async function deleteVisita(id: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
        return { error: "não autenticado" };
    }

    try {
        const { data, error } = await supabase
            .from("visitas")
            .delete()
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao deletar visita:", error);
            return { error: error.message || "Erro ao deletar visita" };
        }

        return { data };
    } catch (err) {
        console.error("Erro inesperado:", err);
        return { error: "Erro inesperado ao deletar visita" };
    }
}
