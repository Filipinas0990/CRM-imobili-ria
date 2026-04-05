import { supabase } from "@/integrations/supabase/client";
import type { Imovel } from "./types";

export async function getImoveis(): Promise<Imovel[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const user_id = authData.user.id;

    const { data, error } = await supabase
        .from("imoveis")
        .select(`
            id,
            titulo,
            descricao,
            preco,
            endereco,
            tipo,
            quartos,
            banheiros,
            area,
            image_url,
            foto_path,

            construtora,
            classificacao,
            id_canal_pro,
            status,
            fase_obra,

            estado,
            cep,
            cidade,
            bairro,
            complemento,

            renda_ideal,
            preco_varia,
            iptu,
            unidades_disponiveis,
            sob_consulta,

            area_minima,
            area_maxima,
            vagas_garagem,

            criado_em,
            created_at,
            updated_at
        `)
        .eq("owner_id", user_id)
        .order("criado_em", { ascending: false });

    if (error) {
        console.error("Erro ao carregar imóveis:", error);
        return [];
    }

    return data as Imovel[];
}