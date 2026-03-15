import { supabase } from "@/integrations/supabase/client";

export async function getLeadsWhatsApp() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('ultimo_contato', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data;
}

export async function getTemplates() {
    const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*');

    if (error) throw error;
    return data;
}

export async function getOrCreateConversation(leadId: string) {
    const { data } = await supabase
        .from('whatsapp_conversas')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    if (data) return data;

    const { data: novaConversa, error } = await supabase
        .from('whatsapp_conversas')
        .insert({ lead_id: leadId })
        .select()
        .single();

    if (error) throw error;
    return novaConversa;
}

export async function sendMessage(conversaId: string, leadId: string, mensagem: string) {
    await supabase.from('whatsapp_mensagens').insert({
        conversa_id: conversaId,
        mensagem,
    });

    await supabase.from('whatsapp_conversas').update({
        ultima_mensagem: mensagem,
        data_ultimo_contato: new Date(),
    }).eq('id', conversaId);

    await supabase.from('leads').update({
        ultimo_contato: new Date(),
    }).eq('id', leadId);
}
