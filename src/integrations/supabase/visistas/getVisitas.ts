import { supabase } from "@/integrations/supabase/client";

export async function getVisitas() {
    // Buscar visitas
    const { data: visitasData, error: visitasError } = await supabase
        .from("visitas")
        .select("id, data, anotacoes, lead_id, imovel_id")
        .order("data", { ascending: true });

    if (visitasError) {
        console.error("Erro ao buscar visitas:", visitasError);
        return { data: [], error: visitasError };
    }

    if (!visitasData || visitasData.length === 0) {
        return { data: [], error: null };
    }

    // Buscar leads
    const leadIds = visitasData.map((v) => v.lead_id).filter(Boolean);
    const { data: leadsData } = await supabase
        .from("leads")
        .select("id, nome, telefone")
        .in("id", leadIds.length > 0 ? leadIds : ["00000000-0000-0000-0000-000000000000"]);

    // Buscar imóveis
    const imovelIds = visitasData.map((v) => v.imovel_id).filter(Boolean);
    const { data: imoveisData } = await supabase
        .from("imoveis")
        .select("id, titulo, endereco")
        .in("id", imovelIds.length > 0 ? imovelIds : ["00000000-0000-0000-0000-000000000000"]);

    // Criar mapas para lookup rápido
    const leadsMap = new Map((leadsData || []).map((l) => [l.id, l]));
    const imoveisMap = new Map((imoveisData || []).map((i) => [i.id, i]));

    // Transformar dados
    const visitas = visitasData.map((visita) => {
        const lead = leadsMap.get(visita.lead_id);
        const imovel = imoveisMap.get(visita.imovel_id);

        return {
            id: visita.id,
            lead_id: visita.lead_id,
            imovel_id: visita.imovel_id,
            data: visita.data,
            anotacoes: visita.anotacoes,
            clienteNome: lead?.nome || "Cliente não informado",
            clienteTelefone: lead?.telefone || "",
            imovelNome: imovel?.titulo || "Imóvel não informado",
            imovelEndereco: imovel?.endereco || "",
        };
    });

    return { data: visitas, error: null };
}
