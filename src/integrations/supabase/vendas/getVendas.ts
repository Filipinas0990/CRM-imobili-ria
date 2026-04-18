import { supabase } from "../client";

export async function getVendas() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const { data, error } = await supabase
        .from("vendas")
        .select("id, valor, tipo, status, lead_id, imovel_id, created_at, data_venda, base_calculo_pct, percentual_imposto, valor_indicacao, premiacao_venda, data_prev_comissao, base_calculo_tipo, corretor_id")
        .eq("corretor_id", authData.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao buscar vendas:", error);
        return [];
    }

    return data;
}