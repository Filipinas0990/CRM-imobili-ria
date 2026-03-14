import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Search, Send, Phone, Clock, MessageCircle,
    Bot, User, Wifi, WifiOff, QrCode, Loader2, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { supabase } from "@/integrations/supabase/client";

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/evolution-proxy`;


const statusColors: Record<string, string> = {
    novo: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    contato: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    proposta: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    fechado: "bg-green-500/20 text-green-400 border border-green-500/30",
    desistiu: "bg-red-500/20 text-red-400 border border-red-500/30",
};

type ConnStatus = "checking" | "connected" | "disconnected" | "loading_qr" | "qr_ready";

interface Mensagem {
    id: string;
    mensagem: string;
    from_me: boolean;
    timestamp: number;
}

const WhatsApp = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [message, setMessage] = useState("");
    const [busca, setBusca] = useState("");
    const [sending, setSending] = useState(false);
    const [connStatus, setConnStatus] = useState<ConnStatus>("checking");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Pega usuário logado e instância ───────────────────────────────
    useEffect(() => {
        async function initUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const instName = `inst-${user.id.slice(0, 8)}`;

            let { data: inst } = await supabase
                .from("whatsapp_instancias")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (!inst) {
                const { data: nova } = await supabase
                    .from("whatsapp_instancias")
                    .insert({ user_id: user.id, instance_name: instName, status: "disconnected" })
                    .select()
                    .single();
                inst = nova;
            }

            setInstanceName(inst?.instance_name ?? instName);
        }
        initUser();
    }, []);

    // ── Evolution helpers ──────────────────────────────────────────────
    const evoFetch = useCallback(async (path: string, options?: RequestInit) => {
        const res = await fetch(`${PROXY_URL}?path=${encodeURIComponent(path)}`, {
            ...options,
            headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    }, []);

    // ── Busca mensagens da Evolution API ──────────────────────────────
    const fetchMensagens = useCallback(async (lead: any, instName: string) => {
        if (!lead?.telefone || !instName) return;
        try {
            const phone = `55${lead.telefone.replace(/\D/g, "")}@s.whatsapp.net`;
            const data = await evoFetch(`/chat/findMessages/${instName}`, {
                method: "POST",
                body: JSON.stringify({
                    where: { key: { remoteJid: phone } },
                    limit: 50,
                }),
            });

            const msgs: Mensagem[] = (data?.messages?.records ?? data?.records ?? data ?? [])
                .map((m: any) => ({
                    id: m.id ?? m.key?.id ?? Math.random().toString(),
                    mensagem: m.message?.conversation
                        ?? m.message?.extendedTextMessage?.text
                        ?? m.content
                        ?? "",
                    from_me: m.key?.fromMe ?? m.fromMe ?? false,
                    timestamp: m.messageTimestamp ?? m.timestamp ?? 0,
                }))
                .filter((m: Mensagem) => m.mensagem)
                .sort((a: Mensagem, b: Mensagem) => a.timestamp - b.timestamp);

            setMensagens(msgs);
        } catch {
            setMensagens([]);
        }
    }, [evoFetch]);

    // ── Conexão WhatsApp ───────────────────────────────────────────────
    const checkConnection = useCallback(async () => {
        if (!instanceName) return;
        try {
            const data = await evoFetch(`/instance/connectionState/${instanceName}`);
            const state = data?.instance?.state ?? data?.state;
            if (state === "open") {
                setConnStatus("connected");
                setQrCode(null);
                if (pollRef.current) clearInterval(pollRef.current);
                if (userId) {
                    await supabase.from("whatsapp_instancias")
                        .update({ status: "connected" })
                        .eq("user_id", userId);
                }
            } else {
                setConnStatus("disconnected");
            }
        } catch {
            setConnStatus("disconnected");
        }
    }, [evoFetch, instanceName, userId]);

    const fetchQrCode = useCallback(async () => {
        if (!instanceName) return;
        setConnStatus("loading_qr");
        setQrError(null);
        try {
            try {
                await evoFetch(`/instance/create`, {
                    method: "POST",
                    body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
                });
            } catch { /* já existe */ }

            const data = await evoFetch(`/instance/connect/${instanceName}`);
            const base64 = data?.base64 ?? data?.qrcode?.base64 ?? data?.qr ?? data?.code;

            if (base64) {
                const src = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
                setQrCode(src);
                setConnStatus("qr_ready");
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = setInterval(checkConnection, 3000);
            } else {
                setQrError("QR Code não retornado. Tente novamente.");
                setConnStatus("disconnected");
            }
        } catch (err: any) {
            setQrError(`Erro: ${err.message}`);
            setConnStatus("disconnected");
        }
    }, [evoFetch, instanceName, checkConnection]);

    useEffect(() => {
        if (!instanceName) return;
        checkConnection();
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [instanceName, checkConnection]);

    // ── Polling de mensagens novas a cada 5s ──────────────────────────
    useEffect(() => {
        if (!selectedLead || !instanceName || connStatus !== "connected") return;

        fetchMensagens(selectedLead, instanceName);

        msgPollRef.current = setInterval(() => {
            fetchMensagens(selectedLead, instanceName);
        }, 5000);

        return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
    }, [selectedLead, instanceName, connStatus, fetchMensagens]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

    // ── Leads & templates ──────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            const leadsData = await getLeads();
            const { data: t } = await supabase.from("whatsapp_templates").select("*");
            setLeads(leadsData ?? []);
            setTemplates(t ?? []);
        }
        load();
    }, []);

    const filteredLeads = leads.filter(
        (l) => l.nome?.toLowerCase().includes(busca.toLowerCase()) || (l.telefone ?? "").includes(busca)
    );

    // ── Enviar mensagem ────────────────────────────────────────────────
    async function handleSend() {
        if (!selectedLead || !message.trim() || !instanceName) return;
        setSending(true);

        const phone = `55${selectedLead.telefone.replace(/\D/g, "")}`;

        // Adiciona mensagem otimisticamente na tela
        const tempMsg: Mensagem = {
            id: `temp-${Date.now()}`,
            mensagem: message,
            from_me: true,
            timestamp: Date.now() / 1000,
        };
        setMensagens((prev) => [...prev, tempMsg]);

        if (connStatus === "connected") {
            try {
                await evoFetch(`/message/sendText/${instanceName}`, {
                    method: "POST",
                    body: JSON.stringify({ number: phone, text: message }),
                });
                // Recarrega mensagens após envio
                setTimeout(() => fetchMensagens(selectedLead, instanceName), 1000);
            } catch {
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
            }
        } else {
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        }

        await supabase.from("leads").update({ ultimo_contato: new Date() }).eq("id", selectedLead.id);
        setMessage("");
        setSending(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    }

    return (
        <div className="h-screen flex bg-white dark:bg-[#0a0d14] overflow-hidden relative">
            <Sidebar />

            {/* QR Modal */}
            {(connStatus === "loading_qr" || connStatus === "qr_ready") && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
                        {connStatus === "loading_qr" ? (
                            <>
                                <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
                                <p className="text-gray-500 dark:text-white/60 text-sm">Gerando QR Code...</p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-green-400">
                                    <QrCode className="w-5 h-5" />
                                    <span className="font-semibold">Conectar WhatsApp</span>
                                </div>
                                {qrCode && (
                                    <div className="p-3 bg-white rounded-xl">
                                        <img src={qrCode} alt="QR Code" className="w-52 h-52" />
                                    </div>
                                )}
                                <div className="text-center space-y-1">
                                    <p className="text-white/70 text-sm font-medium">Escaneie com seu celular</p>
                                    <p className="text-white/30 text-xs">WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo</p>
                                </div>
                                {qrError && <p className="text-red-400 text-xs">{qrError}</p>}
                                <button onClick={fetchQrCode} className="text-xs text-white/30 hover:text-white flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Gerar novo QR Code
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="ml-16 flex-1 flex overflow-hidden">
                {/* Lista de leads */}
                <div className="w-96 border-r border-gray-200 dark:border-white/5 flex flex-col flex-shrink-0 bg-white dark:bg-transparent">
                    <div className="px-4 py-4 border-b border-gray-200 dark:border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">WhatsApp</h1>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {connStatus === "checking" && <><Loader2 className="w-3 h-3 text-white/30 animate-spin" /><span className="text-xs text-white/30">Verificando...</span></>}
                                    {connStatus === "connected" && <><Wifi className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Conectado</span></>}
                                    {(connStatus === "disconnected" || connStatus === "qr_ready" || connStatus === "loading_qr") && (
                                        <button onClick={fetchQrCode} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                                            <WifiOff className="w-3 h-3" /> Desconectado
                                        </button>
                                    )}
                                </div>
                            </div>
                            {connStatus !== "connected" && connStatus !== "checking" && (
                                <Button onClick={fetchQrCode} size="sm" className="bg-green-600 hover:bg-green-500 text-white h-8 text-xs px-3">
                                    <QrCode className="w-3 h-3 mr-1" /> Conectar
                                </Button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                                placeholder="Buscar lead..."
                                className="pl-9 bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:border-green-500/50 h-9"
                                value={busca} onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {filteredLeads.map((lead) => {
                            const isSelected = selectedLead?.id === lead.id;
                            return (
                                <button key={lead.id} onClick={() => setSelectedLead(lead)}
                                    className={`w-full text-left px-4 py-5 border-b border-gray-100 dark:border-white/5 transition-all ${isSelected ? "bg-green-500/10 border-l-2 border-l-green-500" : "hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{lead.nome}</p>
                                            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 truncate">{lead.telefone}</p>
                                        </div>
                                        <Badge className={`text-xs shrink-0 ${statusColors[lead.status] ?? "bg-white/10 text-white/50"}`}>
                                            {lead.status}
                                        </Badge>
                                    </div>
                                    {lead.ultimo_contato && (
                                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 dark:text-white/25">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(lead.ultimo_contato), "dd MMM", { locale: ptBR })}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat */}
                {selectedLead ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/5 flex items-center gap-3 bg-white dark:bg-transparent">
                            <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedLead.nome}</p>
                                <p className="text-xs text-gray-500 dark:text-white/40 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />{selectedLead.telefone}
                                </p>
                            </div>
                            <Badge className={statusColors[selectedLead.status] ?? ""}>{selectedLead.status}</Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50 dark:bg-transparent [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-white/10">
                            {loadingMsgs && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                                </div>
                            )}
                            {!loadingMsgs && mensagens.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
                                    <MessageCircle className="w-10 h-10" />
                                    <p className="text-sm">Nenhuma mensagem ainda</p>
                                    {connStatus !== "connected" && (
                                        <p className="text-xs text-center max-w-xs">Conecte o WhatsApp para ver as mensagens</p>
                                    )}
                                </div>
                            )}
                            {mensagens.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.from_me ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.from_me ? "bg-green-600 text-white rounded-br-sm" : "bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-transparent"
                                        }`}>
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.mensagem}</p>
                                        <p className={`text-xs mt-1 ${msg.from_me ? "text-green-200/50" : "text-gray-400 dark:text-white/30"}`}>
                                            {msg.timestamp ? format(new Date(msg.timestamp * 1000), "HH:mm") : ""}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {templates.length > 0 && (
                            <div className="px-5 py-2 border-t border-gray-200 dark:border-white/5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden bg-white dark:bg-transparent">
                                {templates.map((t) => (
                                    <button key={t.id} onClick={() => setMessage(t.mensagem)}
                                        className="shrink-0 px-3 py-1.5 text-xs bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap">
                                        {t.titulo}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="px-5 py-4 border-t border-gray-200 dark:border-white/5 flex gap-3 items-end bg-white dark:bg-transparent">
                            <Textarea
                                placeholder="Digite sua mensagem... (Enter para enviar)"
                                value={message} onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown} rows={2}
                                className="flex-1 bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 resize-none focus:border-green-500/50 text-sm"
                            />
                            <Button onClick={handleSend} disabled={!message.trim() || sending}
                                className="bg-green-600 hover:bg-green-500 text-white h-10 w-10 p-0 shrink-0">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-white/20 gap-3">
                        <MessageCircle className="w-14 h-14" />
                        <p className="text-base text-gray-400 dark:text-white/20">Selecione um lead para iniciar a conversa</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsApp;