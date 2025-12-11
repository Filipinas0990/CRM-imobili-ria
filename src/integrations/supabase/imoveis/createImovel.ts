import { supabase } from "@/integrations/supabase/client";
import { uploadImovelImage } from "./uploadImage";

export async function createImovel(payload: any, file?: File) {
    try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id ?? null;

        const baseInsert = {
            ...payload,
            owner_id: userId,
        };

        // 1️⃣ cria imóvel sem imagem
        const { data: imovel, error: insertError } = await supabase
            .from("imoveis")
            .insert([baseInsert])
            .select()
            .single();

        if (insertError) {
            console.error("ERRO SUPABASE INSERT:", insertError);
            return { error: insertError };
        }

        // 2️⃣ se enviou imagem, faz upload
        if (file) {
            const { data: imgData, error: imgError } = await uploadImovelImage(
                file,
                imovel.id
            );

            if (!imgError && imgData?.image_url) {
                await supabase
                    .from("imoveis")
                    .update({ image_url: imgData.image_url })
                    .eq("id", imovel.id);
            }
        }

        return { data: imovel };
    } catch (err) {
        console.error("createImovel unexpected:", err);
        return { error: String(err) };
    }
}
