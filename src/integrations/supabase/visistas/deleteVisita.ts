import { supabase } from "@/integrations/supabase/client";

export async function deleteVisita(id: string) {
    // 1️⃣ Verificar se o usuário está autenticado
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
        return { error: "não autenticado" };
    }

    try {
        // 2️⃣ Deletar a visita
        const { data, error } = await supabase
            .from("visitas")
            .delete()
            .eq("id", id)
            .select()
            .single();

        // 3️⃣ Erro vindo do Supabase
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
