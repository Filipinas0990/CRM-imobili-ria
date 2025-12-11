import { supabase } from "@/integrations/supabase/client";

export async function updateImovel(id: string, data: any) {

    const { error } = await supabase
        .from("imoveis")
        .update({
            titulo: data.titulo,
            descricao: data.descricao,
            preco: data.preco,
            quartos: data.quartos,
            banheiros: data.banheiros,
            area: data.area,
            endereco: data.endereco,
            cidade: data.cidade,

            // 🔥 MOST IMPORTANT
            foto_path: data.foto_path,
        })
        .eq("id", id);

    if (error) {
        console.error("Erro ao atualizar imóvel:", error);
        return { error };
    }

    return { success: true };
}
