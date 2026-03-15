import { supabase } from "@/integrations/supabase/client";

interface CreateVendaProps {
    lead_id: string;
    imovel_id: string;
    valor: number;
    tipo: string;
    status: string;
}

export async function createVenda({
    lead_id,
    imovel_id,
    valor,
    tipo,
    status,
}: CreateVendaProps) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Usuário não autenticado");
    }

    const { error } = await supabase.from("vendas").insert({
        lead_id,
        imovel_id,
        valor,
        tipo,
        status,
        corretor_id: user.id, // 🔥 AQUI ESTÁ A CORREÇÃO
    });

    if (error) {
        console.error("Erro ao criar venda:", error);
        throw error;
    }
    await supabase.from("atividades").insert([
        {
            title: "Nova venda criada",
            description: `Valor R$ ${valor}`,
            lead_id,
        },
    ]);

}
