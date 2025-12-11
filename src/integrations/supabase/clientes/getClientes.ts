import { supabase } from "@/integrations/supabase/client";

export async function getClientes() {
    try {
        // Obtém usuário autenticado
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
            console.error("Erro ao obter usuário:", authError);
            return { data: [] };
        }

        const userId = authData.user.id;

        // Busca clientes filtrando pelo usuário
        const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .eq("user_id", userId)
            .order("nome", { ascending: true });

        if (error) {
            console.error("Erro ao buscar clientes:", error);
            return { data: [] };
        }

        return { data };

    } catch (err) {
        console.error("Erro inesperado em getClientes:", err);
        return { data: [] };
    }
}
