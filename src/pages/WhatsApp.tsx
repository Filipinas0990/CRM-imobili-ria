import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Search, Send, Phone, MessageCircle,
    Wifi, WifiOff, QrCode, Loader2, RefreshCw,
    X, Smile, Paperclip, Mic, CheckCheck,
    Plus, MoreVertical, ArrowLeftRight, Settings, Bell, User
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/evolution-proxy`;

type ConnStatus = "checking" | "connected" | "disconnected" | "loading_qr" | "qr_ready";
type TabStatus = "pendentes" | "atendimento" | "fechados";

interface Conversa {
    id: string;
    remoteJid: string;
    nomeContato: string;
    telefone: string;
    ultimaMensagem: string;
    timestamp: number;
    unread: number;
    status: TabStatus;
    fromMe: boolean;
}

interface Mensagem {
    id: string;
    mensagem: string;
    from_me: boolean;
    timestamp: number;
}

function getInitials(name: string) {
    const clean = name.replace(/^\+\d{1,3}\s?\(?\d{2}\)?\s?/, "").trim();
    if (!clean || clean.match(/^\d/)) {
        const digits = name.replace(/\D/g, "");
        return digits.slice(-2);
    }
    return clean.split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();
}

function formatPhone(jid: string) {
    const num = jid.replace("@s.whatsapp.net", "");
    if (num.startsWith("55") && num.length >= 12) {
        const ddd = num.slice(2, 4);
        const rest = num.slice(4);
        return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    return `+${num}`;
}

const avatarColors = [
    "#4F86F7", "#7C5CBF", "#E05FA0",
    "#F4874B", "#2BBFA4", "#5B6FD6",
    "#E05555", "#29B8D4", "#3DBD7D", "#F0B429",
];

function getAvatarColor(jid: string) {
    const num = jid.replace("@s.whatsapp.net", "").replace(/^\+/, "");
    const sum = num.split("").reduce((acc, c) => acc + (parseInt(c) || 0), 0);
    return avatarColors[sum % avatarColors.length];
}

const WhatsApp = () => {
    const [conversas, setConversas] = useState<Conversa[]>([]);
    const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [message, setMessage] = useState("");
    const [busca, setBusca] = useState("");
    const [sending, setSending] = useState(false);
    const [connStatus, setConnStatus] = useState<ConnStatus>("checking");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabStatus>("pendentes");
    const [conversaStatus, setConversaStatus] = useState<Record<string, TabStatus>>({});
    const [loadingConversas, setLoadingConversas] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        async function initUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            const instName = `inst-${user.id.slice(0, 8)}`;
            let { data: inst } = await supabase.from("whatsapp_instancias").select("*").eq("user_id", user.id).single();
            if (!inst) {
                const { data: nova } = await supabase.from("whatsapp_instancias")
                    .insert({ user_id: user.id, instance_name: instName, status: "disconnected" })
                    .select().single();
                inst = nova;
            }
            setInstanceName(inst?.instance_name ?? instName);
        }
        initUser();
        supabase.from("whatsapp_templates").select("*").then(({ data }) => setTemplates(data ?? []));
    }, []);

    const evoFetch = useCallback(async (path: string, options?: RequestInit) => {
        const res = await fetch(`${PROXY_URL}?path=${encodeURIComponent(path)}`, {
            ...options,
            headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    }, []);

    const fetchConversas = useCallback(async (instName: string) => {
        if (!instName) return;
        setLoadingConversas(true);
        try {
            const data = await evoFetch(`/chat/findChats/${instName}`, { method: "POST", body: JSON.stringify({}) });
            const chats: any[] = Array.isArray(data) ? data : data?.chats ?? data?.data ?? data?.records ?? [];
            const lista: Conversa[] = chats
                .filter((c: any) => c.remoteJid?.endsWith("@s.whatsapp.net"))
                .map((c: any) => {
                    const jid: string = c.remoteJid;
                    const nome = c.pushName ?? c.name ?? formatPhone(jid);
                    const ultima = c.lastMessage?.message?.conversation
                        ?? c.lastMessage?.message?.extendedTextMessage?.text
                        ?? (c.lastMessage ? "[mídia]" : "Nenhuma mensagem");
                    return {
                        id: jid,
                        remoteJid: jid,
                        nomeContato: nome,
                        telefone: formatPhone(jid),
                        ultimaMensagem: ultima,
                        timestamp: c.lastMessage?.messageTimestamp
                            ?? (c.updatedAt ? new Date(c.updatedAt).getTime() / 1000 : 0),
                        unread: c.unreadCount ?? c.unreadMessages ?? 0,
                        status: conversaStatus[jid] ?? "pendentes",
                        fromMe: c.lastMessage?.key?.fromMe ?? false,
                    };
                })
                .sort((a, b) => b.timestamp - a.timestamp);
            setConversas(lista);
        } catch { setConversas([]); }
        finally { setLoadingConversas(false); }
    }, [evoFetch, conversaStatus]);

    const fetchMensagens = useCallback(async (conversa: Conversa, instName: string) => {
        if (!conversa || !instName) return;
        try {
            const data = await evoFetch(`/chat/findMessages/${instName}`, {
                method: "POST",
                body: JSON.stringify({
                    where: { key: { remoteJid: conversa.remoteJid } },
                    limit: 50,
                }),
            });
            const allRecords = data?.messages?.records ?? data?.records ?? data ?? [];
            const seen = new Set<string>();
            const msgs: Mensagem[] = allRecords
                .filter((m: any) => {
                    const keyId = m.key?.id;
                    if (!keyId || seen.has(keyId)) return false;
                    seen.add(keyId);
                    return true;
                })
                .map((m: any) => ({
                    id: m.id ?? m.key?.id ?? Math.random().toString(),
                    mensagem: m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? m.content ?? "",
                    from_me: m.key?.fromMe ?? false,
                    timestamp: m.messageTimestamp ?? 0,
                }))
                .filter((m: Mensagem) => m.mensagem)
                .sort((a: Mensagem, b: Mensagem) => a.timestamp - b.timestamp);
            setMensagens(msgs);
        } catch { setMensagens([]); }
    }, [evoFetch]);

    const checkConnection = useCallback(async () => {
        if (!instanceName) return;
        try {
            const data = await evoFetch(`/instance/connectionState/${instanceName}`);
            const state = data?.instance?.state ?? data?.state;
            if (state === "open") {
                setConnStatus("connected");
                setQrCode(null);
                if (pollRef.current) clearInterval(pollRef.current);
                if (userId) await supabase.from("whatsapp_instancias").update({ status: "connected" }).eq("user_id", userId);
            } else { setConnStatus("disconnected"); }
        } catch { setConnStatus("disconnected"); }
    }, [evoFetch, instanceName, userId]);

    const fetchQrCode = useCallback(async () => {
        if (!instanceName) return;
        setConnStatus("loading_qr"); setQrError(null);
        try {
            try { await evoFetch(`/instance/create`, { method: "POST", body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }) }); } catch { }
            const data = await evoFetch(`/instance/connect/${instanceName}`);
            const base64 = data?.base64 ?? data?.qrcode?.base64 ?? data?.qr ?? data?.code;
            if (base64) {
                setQrCode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
                setConnStatus("qr_ready");
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = setInterval(checkConnection, 3000);
            } else { setQrError("QR Code não retornado."); setConnStatus("disconnected"); }
        } catch (err: any) { setQrError(`Erro: ${err.message}`); setConnStatus("disconnected"); }
    }, [evoFetch, instanceName, checkConnection]);

    useEffect(() => {
        if (!instanceName) return;
        checkConnection();
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [instanceName, checkConnection]);

    useEffect(() => {
        if (connStatus === "connected" && instanceName) fetchConversas(instanceName);
    }, [connStatus, instanceName, fetchConversas]);

    useEffect(() => {
        if (!selectedConversa || !instanceName || connStatus !== "connected") return;
        fetchMensagens(selectedConversa, instanceName);
        msgPollRef.current = setInterval(() => fetchMensagens(selectedConversa, instanceName), 5000);
        return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
    }, [selectedConversa, instanceName, connStatus, fetchMensagens]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

    function changeStatus(jid: string, status: TabStatus) {
        setConversaStatus((prev) => ({ ...prev, [jid]: status }));
        setConversas((prev) => prev.map((c) => c.remoteJid === jid ? { ...c, status } : c));
        if (selectedConversa?.remoteJid === jid)
            setSelectedConversa((prev) => prev ? { ...prev, status } : prev);
    }

    async function handleSend() {
        if (!selectedConversa || !message.trim() || !instanceName) return;
        setSending(true);
        const phone = selectedConversa.remoteJid.replace("@s.whatsapp.net", "");
        setMensagens((prev) => [...prev, { id: `temp-${Date.now()}`, mensagem: message, from_me: true, timestamp: Date.now() / 1000 }]);
        try {
            await evoFetch(`/message/sendText/${instanceName}`, { method: "POST", body: JSON.stringify({ number: phone, text: message }) });
            setTimeout(() => fetchMensagens(selectedConversa, instanceName), 1000);
        } catch { window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank"); }
        setMessage(""); setSending(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    }

    const filteredConversas = conversas
        .filter((c) => c.status === activeTab)
        .filter((c) => c.nomeContato.toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca));

    const countByTab = (tab: TabStatus) => conversas.filter((c) => c.status === tab).length;

    return (
        <div className="h-screen flex bg-[#f5f6fa] dark:bg-[#0f1117] overflow-hidden transition-colors duration-200">
            <Sidebar />

            {/* QR Modal */}
            {(connStatus === "loading_qr" || connStatus === "qr_ready") && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 shadow-2xl">
                        {connStatus === "loading_qr" ? (
                            <><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /><p className="text-gray-500 dark:text-gray-400 text-sm">Gerando QR Code...</p></>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <QrCode className="w-5 h-5" />
                                    <span className="font-semibold">Conectar WhatsApp</span>
                                </div>
                                {qrCode && <div className="p-3 bg-white border rounded-xl"><img src={qrCode} alt="QR Code" className="w-52 h-52" /></div>}
                                <div className="text-center space-y-1">
                                    <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">Escaneie com seu celular</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-xs">WhatsApp → Menu (⋮) → Dispositivos conectados</p>
                                </div>
                                {qrError && <p className="text-red-500 text-xs">{qrError}</p>}
                                <button onClick={fetchQrCode} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Gerar novo QR Code
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="ml-16 flex-1 flex flex-col overflow-hidden">

                {/* ── Page Header ── */}
                <div className="h-16 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-8 justify-between shrink-0 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Chat WhatsApp</h1>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Portum</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {connStatus === "checking" && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...
                            </span>
                        )}
                        {connStatus === "connected" && (
                            <span className="flex items-center gap-1.5 text-xs text-green-500">
                                <Wifi className="w-3.5 h-3.5" /> Conectado
                            </span>
                        )}
                        {connStatus === "disconnected" && (
                            <button onClick={fetchQrCode} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500">
                                <WifiOff className="w-3.5 h-3.5" /> Desconectado
                            </button>
                        )}

                        <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>

                        <div className="relative">
                            <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                                <Bell className="w-4 h-4" />
                            </button>
                            {conversas.filter(c => c.unread > 0).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                    {conversas.filter(c => c.unread > 0).length}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => instanceName && fetchConversas(instanceName)}
                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                            <Plus className="w-4 h-4" /> Nova Conversa
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 flex overflow-hidden p-5 gap-5">

                    {/* ── Conversation List ── */}
                    <div className="w-80 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col shadow-sm shrink-0 overflow-hidden transition-colors duration-200">

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-[#2a2f45] px-3 pt-3 gap-0.5">
                            {([
                                { key: "pendentes", label: "Pendentes" },
                                { key: "atendimento", label: "Em Atendimento" },
                                { key: "fechados", label: "Fechados" },
                            ] as { key: TabStatus; label: string }[]).map(({ key, label }) => {
                                const count = countByTab(key);
                                const isActive = activeTab === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`flex items-center gap-1.5 px-2.5 py-2.5 text-xs font-medium rounded-t-lg transition-all relative whitespace-nowrap
                                            ${isActive
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                            }`}
                                    >
                                        {label}
                                        {count > 0 && (
                                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                                                ${isActive
                                                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                                                    : "bg-gray-200 dark:bg-[#2a2f45] text-gray-500 dark:text-gray-400"
                                                }`}>
                                                {count}
                                            </span>
                                        )}
                                        {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="px-4 py-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                <input
                                    placeholder="Buscar conversas..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-300 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1d27] transition-colors"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                            {loadingConversas && (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin" />
                                </div>
                            )}
                            {!loadingConversas && filteredConversas.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <MessageCircle className="w-8 h-8 text-gray-200 dark:text-gray-600" />
                                    <p className="text-xs text-center px-6 text-gray-400 dark:text-gray-500">
                                        {connStatus !== "connected" ? "Conecte o WhatsApp para ver as conversas" : "Nenhuma conversa aqui"}
                                    </p>
                                </div>
                            )}
                            {filteredConversas.map((conv) => {
                                const isSelected = selectedConversa?.remoteJid === conv.remoteJid;
                                return (
                                    <button
                                        key={conv.remoteJid}
                                        onClick={() => setSelectedConversa(conv)}
                                        className={`w-full text-left px-4 py-3.5 border-b border-gray-50 dark:border-[#22263a] transition-all flex items-center gap-3
                                            ${isSelected
                                                ? "bg-blue-50 dark:bg-[#1e2d4a] border-l-2 border-l-blue-500"
                                                : "hover:bg-gray-50 dark:hover:bg-[#22263a]"
                                            }`}
                                    >
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold select-none"
                                            style={{ backgroundColor: getAvatarColor(conv.remoteJid) }}
                                        >
                                            {getInitials(conv.nomeContato)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className={`font-semibold text-sm truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-100"}`}>
                                                    {conv.nomeContato}
                                                </p>
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                                                    {conv.timestamp ? format(new Date(conv.timestamp * 1000), "HH:mm") : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate pr-2">
                                                    {conv.fromMe && <CheckCheck className="w-3 h-3 inline mr-0.5 text-blue-400" />}
                                                    {conv.ultimaMensagem}
                                                </p>
                                                {conv.unread > 0 && (
                                                    <span className="shrink-0 min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                                        {conv.unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Chat Panel ── */}
                    {selectedConversa ? (
                        <div className="flex-1 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col shadow-sm overflow-hidden transition-colors duration-200">

                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45] flex items-center gap-4 shrink-0">
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold select-none"
                                    style={{ backgroundColor: getAvatarColor(selectedConversa.remoteJid) }}
                                >
                                    {getInitials(selectedConversa.nomeContato)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{selectedConversa.nomeContato}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{selectedConversa.telefone}</p>
                                        <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                                        <button className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                                            <User className="w-3 h-3" /> Ficha
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedConversa.status !== "atendimento" && (
                                        <button
                                            onClick={() => changeStatus(selectedConversa.remoteJid, "atendimento")}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] rounded-xl transition-colors"
                                        >
                                            <ArrowLeftRight className="w-3.5 h-3.5" /> Transferir
                                        </button>
                                    )}
                                    {selectedConversa.status !== "fechados" ? (
                                        <button
                                            onClick={() => changeStatus(selectedConversa.remoteJid, "fechados")}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" /> Fechar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => changeStatus(selectedConversa.remoteJid, "pendentes")}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
                                        >
                                            Reabrir
                                        </button>
                                    )}
                                    <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </button>
                                    <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-[#f5f6fa] dark:bg-[#13161f] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 transition-colors duration-200">
                                {mensagens.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                        <MessageCircle className="w-10 h-10 text-gray-200 dark:text-gray-600" />
                                        <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma mensagem ainda</p>
                                    </div>
                                )}
                                {mensagens.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.from_me ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[60%] px-4 py-3 rounded-2xl text-sm shadow-sm
                                            ${msg.from_me
                                                ? "bg-blue-600 text-white rounded-br-sm"
                                                : "bg-white dark:bg-[#22263a] text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-[#2a2f45]"
                                            }`}>
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.mensagem}</p>
                                            <p className={`text-[10px] mt-1.5 text-right ${msg.from_me ? "text-blue-200/80" : "text-gray-400 dark:text-gray-500"}`}>
                                                {msg.timestamp ? format(new Date(msg.timestamp * 1000), "HH:mm") : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Templates */}
                            {templates.length > 0 && (
                                <div className="px-5 py-2 border-t border-gray-100 dark:border-[#2a2f45] flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden bg-white dark:bg-[#1a1d27]">
                                    {templates.map((t) => (
                                        <button key={t.id} onClick={() => setMessage(t.mensagem)}
                                            className="shrink-0 px-3 py-1.5 text-xs bg-gray-100 dark:bg-[#22263a] hover:bg-blue-50 dark:hover:bg-[#1e2d4a] hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-[#2a2f45] rounded-full text-gray-600 dark:text-gray-400 transition-colors whitespace-nowrap">
                                            {t.titulo}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex items-end gap-3 bg-white dark:bg-[#1a1d27] transition-colors duration-200">
                                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 pb-1">
                                    <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><Smile className="w-5 h-5" /></button>
                                    <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><Paperclip className="w-5 h-5" /></button>
                                </div>
                                <Textarea
                                    placeholder="Digite uma mensagem..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    className="flex-1 bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:border-blue-300 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1d27] text-sm transition-colors rounded-xl"
                                />
                                {message.trim() ? (
                                    <Button
                                        onClick={handleSend}
                                        disabled={sending}
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 w-9 p-0 shrink-0 rounded-full"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                ) : (
                                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0 pb-1">
                                        <Mic className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col items-center justify-center shadow-sm gap-3 transition-colors duration-200">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Selecione uma conversa para começar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsApp;