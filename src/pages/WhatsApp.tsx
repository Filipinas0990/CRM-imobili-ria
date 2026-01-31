import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// SUPABASE
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
    novo: "bg-blue-500/10 text-blue-600",
    contato: "bg-yellow-500/10 text-yellow-600",
    proposta: "bg-purple-500/10 text-purple-600",
    fechado: "bg-green-500/10 text-green-600",
};

const WhatsApp = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [message, setMessage] = useState("");
    const [busca, setBusca] = useState("");

    useEffect(() => {
        async function load() {
            const leadsData = await getLeads();
            const { data: templatesData } = await supabase
                .from("whatsapp_templates")
                .select("*");

            setLeads(leadsData ?? []);
            setTemplates(templatesData ?? []);
        }

        load();
    }, []);

    const filteredLeads = leads.filter(
        (l) =>
            l.nome.toLowerCase().includes(busca.toLowerCase()) ||
            (l.telefone ?? "").includes(busca)
    );

    async function handleSend() {
        if (!selectedLead || !message) return;

        // cria ou busca conversa
        let { data: conversa } = await supabase
            .from("whatsapp_conversas")
            .select("*")
            .eq("lead_id", selectedLead.id)
            .single();

        if (!conversa) {
            const { data } = await supabase
                .from("whatsapp_conversas")
                .insert({ lead_id: selectedLead.id })
                .select()
                .single();

            conversa = data;
        }

        // salva mensagem
        await supabase.from("whatsapp_mensagens").insert({
            conversa_id: conversa.id,
            mensagem: message,
        });

        // atualiza lead
        await supabase
            .from("leads")
            .update({ ultimo_contato: new Date() })
            .eq("id", selectedLead.id);

        // abre WhatsApp
        const phone = selectedLead.telefone.replace(/\D/g, "");
        window.open(
            `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
            "_blank"
        );

        setMessage("");
    }

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            <Sidebar />

            <main className="ml-16 flex-1 overflow-y-auto">
                <div className="p-8 space-y-6">

                    <div>
                        <h1 className="text-3xl font-bold">WhatsApp</h1>
                        <p className="text-muted-foreground mt-2">
                            Inicie conversas com seus leads
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LISTA DE LEADS */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar lead..."
                                            className="pl-10"
                                            value={busca}
                                            onChange={(e) => setBusca(e.target.value)}
                                        />
                                    </div>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="max-h-[600px] overflow-y-auto space-y-3">
                                {filteredLeads.map((lead) => (
                                    <button
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        className="w-full text-left p-3 rounded-lg border hover:bg-muted/30"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{lead.nome}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {lead.telefone}
                                                </p>
                                            </div>

                                            <Badge className={statusColors[lead.status]}>
                                                {lead.status}
                                            </Badge>
                                        </div>

                                        {lead.ultimo_contato && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {format(
                                                    new Date(lead.ultimo_contato),
                                                    "dd MMM",
                                                    { locale: ptBR }
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </CardContent>
                        </Card>

                        {/* CHAT */}
                        <div className="lg:col-span-2 space-y-4">
                            {selectedLead ? (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{selectedLead.nome}</CardTitle>
                                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="w-4 h-4" />
                                                {selectedLead.telefone}
                                            </p>
                                        </CardHeader>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Mensagens rápidas</CardTitle>
                                        </CardHeader>

                                        <CardContent className="grid grid-cols-2 gap-3">
                                            {templates.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setMessage(t.mensagem)}
                                                    className="p-3 text-left border rounded-lg hover:bg-muted/30"
                                                >
                                                    <p className="font-medium text-sm">{t.titulo}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {t.mensagem}
                                                    </p>
                                                </button>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Compor mensagem</CardTitle>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <Textarea
                                                placeholder="Digite sua mensagem..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                rows={4}
                                            />

                                            <div className="flex justify-end">
                                                <Button onClick={handleSend} disabled={!message}>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Enviar WhatsApp
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <Card className="h-full flex items-center justify-center">
                                    <p className="text-muted-foreground">
                                        Selecione um lead para iniciar a conversa
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WhatsApp;
