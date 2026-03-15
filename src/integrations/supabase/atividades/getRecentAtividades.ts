import { supabase } from "@/integrations/supabase/client";

export async function getRecentAtividades(limit = 10) {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data, error } = await supabase
            .from("activities") // 
            .select("*")
            .gte("created_at", threeDaysAgo.toISOString())
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Erro ao buscar atividades:", error);
            return [];
        }

        return data ?? [];
    } catch (err) {
        console.error("getRecentAtividades unexpected:", err);
        return [];
    }
}
