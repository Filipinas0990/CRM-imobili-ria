import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  try {
    const body = await req.json();
    const event = body?.event;
    const data = body?.data;

    if (event === "messages.upsert" && data?.key && !data.key.fromMe) {
      const phone = data.key.remoteJid?.replace("@s.whatsapp.net", "");
      const mensagem = data.message?.conversation 
        ?? data.message?.extendedTextMessage?.text 
        ?? "";

      if (!phone || !mensagem) {
        return new Response("ok", { status: 200 });
      }

      // Busca lead pelo telefone
      const { data: leads } = await supabase
        .from("leads")
        .select("id")
        .ilike("telefone", `%${phone.slice(-8)}%`)
        .limit(1);

      const leadId = leads?.[0]?.id;
      if (!leadId) return new Response("ok", { status: 200 });

      // Busca ou cria conversa
      let { data: conversa } = await supabase
        .from("whatsapp_conversas")
        .select("id")
        .eq("lead_id", leadId)
        .single();

      if (!conversa) {
        const { data: nova } = await supabase
          .from("whatsapp_conversas")
          .insert({ lead_id: leadId })
          .select()
          .single();
        conversa = nova;
      }

      // Salva mensagem
      await supabase.from("whatsapp_mensagens").insert({
        conversa_id: conversa.id,
        mensagem,
        from_me: false,
        from_bot: false,
      });

      // Atualiza último contato
      await supabase
        .from("leads")
        .update({ ultimo_contato: new Date() })
        .eq("id", leadId);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});