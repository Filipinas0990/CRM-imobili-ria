import { supabase } from "@/integrations/supabase/client";

export async function updateImovel(id: string, data: any) {

    const { error } = await supabase
        .from("imoveis")
        .update({
       
            titulo:               data.titulo,
            descricao:            data.descricao,
            preco:                data.preco,
            quartos:              data.quartos,
            banheiros:            data.banheiros,
            area:                 data.area,
            endereco:             data.endereco,
            foto_path:            data.foto_path,

           
            tipo:                 data.tipo,
            construtora:          data.construtora,
            classificacao:        data.classificacao,
            id_canal_pro:         data.id_canal_pro,
            status:               data.status,
            fase_obra:            data.fase_obra,

           
            estado:               data.estado,
            cep:                  data.cep,
            cidade:               data.cidade,
            bairro:               data.bairro,
            complemento:          data.complemento,

        
            renda_ideal:          data.renda_ideal,
            preco_varia:          data.preco_varia,
            iptu:                 data.iptu,
            unidades_disponiveis: data.unidades_disponiveis,
            sob_consulta:         data.sob_consulta,

       
            area_minima:          data.area_minima,
            area_maxima:          data.area_maxima,
            vagas_garagem:        data.vagas_garagem,
        })
        .eq("id", id);

    if (error) {
        console.error("Erro ao atualizar imóvel:", error);
        return { error };
    }

    return { success: true };
}