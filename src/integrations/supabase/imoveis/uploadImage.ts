// src/integrations/supabase/imoveis/uploadImage.ts
import { supabase } from "@/integrations/supabase/client";

export async function uploadImovelImage(file: File, imovelId: string) {
    const filePath = `${imovelId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from("imoveis") // o nome do bucket, ajuste se for diferente
        .upload(filePath, file);

    if (uploadError) {
        console.error("Erro ao fazer upload da imagem:", uploadError);
        return { error: uploadError };
    }

    const { data: publicUrlData } = supabase.storage
        .from("imoveis")
        .getPublicUrl(filePath);

    return {
        data: {
            image_url: publicUrlData.publicUrl,
        },
    };
}
