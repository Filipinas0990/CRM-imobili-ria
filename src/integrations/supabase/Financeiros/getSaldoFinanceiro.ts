import { supabase } from "@/integrations/supabase/client";

export async function getSaldoFinanceiro() {
    const { data, error } = await supabase
        .from("financeiro")
        .select("valor, tipo")
        .eq("status", "confirmado");

    if (error || !data) {
        console.error("Erro ao buscar saldo financeiro", error);
        return 0;
    }

    let entradas = 0;
    let saidas = 0;

    data.forEach((t) => {
        if (t.tipo === "entrada") entradas += Number(t.valor);
        if (t.tipo === "saida") saidas += Number(t.valor);
    });

    return entradas - saidas;
}
