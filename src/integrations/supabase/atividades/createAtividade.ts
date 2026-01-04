import { supabase } from "@/integrations/supabase/client";

type CreateActivityProps = {
    title: string;
    description?: string;
    type: "lead" | "cliente" | "venda" | "financeiro" | "visita";
    entity?: string;
    entity_id?: string;
};

export async function createActivity({
    title,
    description,
    type,
    entity,
    entity_id,
}: CreateActivityProps) {
    try {
        const { error } = await supabase.from("activities").insert([
            {
                title,
                description,
                type,
                entity,
                entity_id,
            },
        ]);

        if (error) {
            console.error("Erro ao criar atividade:", error);
        }
    } catch (err) {
        console.error("createActivity unexpected:", err);
    }
}
