import { supabase } from "@/integrations/supabase/client";
import type { Imovel } from "./types";

export async function getImoveis(): Promise<Imovel[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const user_id = authData.user.id;

    const { data, error } = await supabase
        .from("imoveis")
        .select("id, titulo, descricao, preco, endereco, tipo, quartos, banheiros, area, image_url")
        .eq("owner_id", user_id)
        .order("criado_em", { ascending: false });

    if (error) {
        console.error("Erro ao carregar imóveis:", error);
        return [];
    }

    return data as Imovel[];
}
