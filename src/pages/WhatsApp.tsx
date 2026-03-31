import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Search, Send, MessageCircle,
    Wifi, WifiOff, QrCode, Loader2, RefreshCw,
    X, Smile, Paperclip, Mic, CheckCheck,
    MoreVertical, ArrowLeftRight, Tag,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPhone(jid: string) {
    const num = jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    if (num.startsWith("55") && num.length >= 12) {
        const ddd = num.slice(2, 4);
        const rest = num.slice(4);
        return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    return `+${num}`;
}

function getInitials(name: string) {
    const clean = name.replace(/^\+\d{1,3}\s?\(?\d{2}\)?\s?/, "").trim();
    if (!clean || clean.match(/^\d/)) return name.replace(/\D/g, "").slice(-2);
    return clean.split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();
}

const AVATAR_COLORS = [
    "#4F86F7", "#7C5CBF", "#E05FA0", "#F4874B",
    "#2BBFA4", "#5B6FD6", "#E05555", "#29B8D4", "#3DBD7D", "#F0B429",
];
function getAvatarColor(jid: string) {
    const sum = jid.replace(/\D/g, "").split("").reduce((a, c) => a + (parseInt(c) || 0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function formatTimestamp(ts: number) {
    if (!ts) return "";
    const date = new Date(ts * 1000);
    const diffH = (Date.now() - date.getTime()) / 36e5;
    if (diffH < 24) return format(date, "HH:mm");
    if (diffH < 48) return "Ontem";
    return format(date, "dd/MM");
}

function extractMsgText(msg: any): string {
    if (!msg) return "";
    const m = msg.message ?? msg;
    if (m?.conversation) return m.conversation;
    if (m?.extendedTextMessage?.text) return m.extendedTextMessage.text;
    if (m?.imageMessage?.caption) return m.imageMessage.caption;
    if (m?.videoMessage?.caption) return m.videoMessage.caption;
    if (m?.documentMessage?.title) return m.documentMessage.title;
    if (m?.audioMessage) return "[Áudio]";
    if (m?.stickerMessage) return "[Figurinha]";
    if (m?.locationMessage) return "[Localização]";
    if (m?.contactMessage) return "[Contato]";
    return "";
}

function normalizeChats(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.chats)) return data.chats;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.records)) return data.records;
    return [];
}

function normalizeMsgs(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages?.records)) return data.messages.records;
    if (Array.isArray(data?.messages)) return data.messages;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

const TAB_CONFIG = [
    { key: "pendentes" as TabStatus, label: "Pendentes", dot: "bg-amber-400", active: "text-amber-500" },
    { key: "atendimento" as TabStatus, label: "Em atendimento", dot: "bg-blue-500", active: "text-blue-500" },
    { key: "fechados" as TabStatus, label: "Fechados", dot: "bg-gray-400", active: "text-gray-400" },
];

// ─── Componente ───────────────────────────────────────────────────────────────
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
    const [loadingConversas, setLoadingConversas] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [statusMap, setStatusMap] = useState<Record<string, TabStatus>>({});
    const [debugInfo, setDebugInfo] = useState<string>("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── evoFetch ───────────────────────────────────────────────────────────────
    const evoFetch = useCallback(async (path: string, options?: RequestInit) => {
        const res = await fetch(`${PROXY_URL}?path=${encodeURIComponent(path)}`, {
            ...options,
            headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
        });
        const text = await res.text();
        try { return JSON.parse(text); } catch { throw new Error(text.slice(0, 200)); }
    }, []);

    // ─── Configura webhook automaticamente para a instância ─────────────────────
    const setupWebhook = useCallback(async (instName: string) => {
        try {
            await evoFetch(`/webhook/set/${instName}`, {
                method: "POST",
                body: JSON.stringify({
                    webhook: {
                        enabled: true,
                        url: `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/whatsapp-webhook`,
                        webhook_by_events: false,
                        webhook_base64: false,
                        events: ["MESSAGES_UPSERT"],
                    },
                }),
            });
            console.log(`✅ Webhook configurado para ${instName}`);
        } catch (err) {
            console.warn(`⚠️ Erro ao configurar webhook para ${instName}:`, err);
        }
    }, [evoFetch]);

    // ─── Carrega status das conversas do Supabase (por usuário, com RLS) ────────
    const loadStatusMap = useCallback(async (uid: string) => {
        const { data } = await supabase
            .from("whatsapp_conversas")
            .select("remote_jid, status")
            .eq("user_id", uid)
            .not("remote_jid", "is", null);
        if (!data) return {};
        const map: Record<string, TabStatus> = {};
        data.forEach((r: any) => { if (r.remote_jid) map[r.remote_jid] = r.status ?? "pendentes"; });
        return map;
    }, []);

    // ─── Salva status no Supabase (upsert leve, só quando muda) ─────────────────
    const saveStatus = useCallback(async (uid: string, remoteJid: string, status: TabStatus) => {
        await supabase.from("whatsapp_conversas").upsert({
            user_id: uid,
            remote_jid: remoteJid,
            status,
            atualizado_em: new Date().toISOString(),
        }, { onConflict: "user_id,remote_jid" });
    }, []);

    // ─── Init: carrega usuário + instância do banco (isolado por user_id) ────────
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const map = await loadStatusMap(user.id);
            setStatusMap(map);

            let { data: inst } = await supabase
                .from("whatsapp_instancias")
                .select("instance_name, status")
                .eq("user_id", user.id)
                .single();

            if (!inst) {
                const instName = `inst-${user.id.slice(0, 8)}`;
                await supabase.from("whatsapp_instancias").insert({
                    user_id: user.id,
                    instance_name: instName,
                    status: "disconnected",
                });
                setInstanceName(instName);
            } else {
                setInstanceName(inst.instance_name);
            }
        }
        init();
        supabase.from("whatsapp_templates").select("*").then(({ data }) => setTemplates(data ?? []));
    }, [loadStatusMap]);

    // ─── Realtime: atualiza statusMap quando outro usuário/aba muda status ───────
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`conversas_${userId}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "whatsapp_conversas",
                filter: `user_id=eq.${userId}`,
            }, (payload: any) => {
                const row = payload.new;
                if (!row?.remote_jid) return;
                setStatusMap((prev) => ({ ...prev, [row.remote_jid]: row.status ?? "pendentes" }));
                setConversas((prev) => prev.map((c) =>
                    c.remoteJid === row.remote_jid ? { ...c, status: row.status ?? "pendentes" } : c
                ));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    // ─── Busca conversas da Evolution ────────────────────────────────────────────
    const fetchConversas = useCallback(async (instName: string, uid: string) => {
        if (!instName || !uid) return;
        setLoadingConversas(true);
        setDebugInfo("Buscando conversas...");

        let instNameReal = instName;
        try {
            const state = await evoFetch(`/instance/connectionState/${instName}`);
            const connState = state?.instance?.state ?? state?.state ?? state?.status;

            if (!connState) {
                const all = await evoFetch("/instance/fetchInstances", { method: "GET" });
                const instances: any[] = Array.isArray(all) ? all : [];
                const connected = instances.filter(
                    (i) => i.connectionStatus === "open" || i.instance?.state === "open"
                );

                if (connected.length > 0) {
                    const { data: allInsts } = await supabase
                        .from("whatsapp_instancias")
                        .select("instance_name, user_id")
                        .eq("user_id", uid);

                    const myInst = connected.find((i) => {
                        const name = i.name ?? i.instanceName ?? i.instance?.instanceName;
                        return allInsts?.some((db) => db.instance_name === name);
                    });

                    if (myInst) {
                        const realName = myInst.name ?? myInst.instanceName ?? myInst.instance?.instanceName;
                        instNameReal = realName;
                        await supabase.from("whatsapp_instancias")
                            .update({ instance_name: realName, status: "connected" })
                            .eq("user_id", uid);
                        setInstanceName(realName);
                    }
                }
            }
        } catch { }

        let rawChats: any[] = [];
        for (const body of [
            JSON.stringify({ where: {}, limit: 100 }),
            JSON.stringify({}),
            JSON.stringify({ limit: 100 }),
        ]) {
            try {
                const data = await evoFetch(`/chat/findChats/${instNameReal}`, { method: "POST", body });
                const chats = normalizeChats(data);
                if (chats.length > 0) { rawChats = chats; break; }
            } catch { }
        }

        setDebugInfo(`${rawChats.length} chats (instância: ${instNameReal})`);

        const map = await loadStatusMap(uid);
        setStatusMap(map);

        const lista: Conversa[] = rawChats
            .filter((c: any) => (c.remoteJid ?? c.id ?? c.jid ?? "").endsWith("@s.whatsapp.net"))
            .map((c: any) => {
                const jid: string = c.remoteJid ?? c.id ?? c.jid ?? "";
                const nome = c.pushName ?? c.name ?? c.contactName ?? formatPhone(jid);
                const lastMsg = c.lastMessage ?? c.Messages?.[0] ?? c.messages?.[0];
                const ultima = extractMsgText(lastMsg) || (lastMsg ? "[mídia]" : "Nenhuma mensagem");
                const ts = lastMsg?.messageTimestamp ?? lastMsg?.timestamp
                    ?? (c.updatedAt ? new Date(c.updatedAt).getTime() / 1000 : 0);
                return {
                    id: jid, remoteJid: jid,
                    nomeContato: nome,
                    telefone: formatPhone(jid),
                    ultimaMensagem: ultima,
                    timestamp: Number(ts),
                    unread: c.unreadCount ?? c.unreadMessages ?? c._count?.Messages ?? 0,
                    status: map[jid] ?? "pendentes",
                    fromMe: lastMsg?.key?.fromMe ?? false,
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);

        setConversas(lista);
        setLoadingConversas(false);
    }, [evoFetch, loadStatusMap]);

    // ─── Busca mensagens ──────────────────────────────────────────────────────────
    const fetchMensagens = useCallback(async (conversa: Conversa, instName: string) => {
        if (!conversa || !instName) return;
        let allRecords: any[] = [];
        for (const body of [
            JSON.stringify({ where: { key: { remoteJid: conversa.remoteJid } }, limit: 50 }),
            JSON.stringify({ where: { remoteJid: conversa.remoteJid }, limit: 50 }),
            JSON.stringify({ remoteJid: conversa.remoteJid, limit: 50 }),
        ]) {
            try {
                const data = await evoFetch(`/chat/findMessages/${instName}`, { method: "POST", body });
                const records = normalizeMsgs(data);
                if (records.length > 0) { allRecords = records; break; }
            } catch { }
        }
        const seen = new Set<string>();
        const msgs: Mensagem[] = allRecords
            .filter((m: any) => {
                const keyId = m.key?.id ?? m.id;
                if (!keyId || seen.has(keyId)) return false;
                seen.add(keyId); return true;
            })
            .map((m: any) => ({
                id: m.key?.id ?? m.id ?? Math.random().toString(),
                mensagem: extractMsgText(m),
                from_me: m.key?.fromMe ?? m.fromMe ?? false,
                timestamp: Number(m.messageTimestamp ?? m.timestamp ?? 0),
            }))
            .filter((m: Mensagem) => m.mensagem)
            .sort((a: Mensagem, b: Mensagem) => a.timestamp - b.timestamp);
        setMensagens(msgs);
    }, [evoFetch]);

    // ─── Verifica conexão ─────────────────────────────────────────────────────────
    const checkConnection = useCallback(async () => {
        if (!instanceName || !userId) return;
        try {
            const data = await evoFetch(`/instance/connectionState/${instanceName}`);
            const state = data?.instance?.state ?? data?.state ?? data?.status;
            if (state === "open" || state === "connected") {
                setConnStatus("connected");
                setQrCode(null);
                if (pollRef.current) clearInterval(pollRef.current);
                await supabase.from("whatsapp_instancias")
                    .update({ status: "connected" })
                    .eq("user_id", userId);
            } else {
                setConnStatus("disconnected");
            }
        } catch { setConnStatus("disconnected"); }
    }, [evoFetch, instanceName, userId]);

    // ─── QR Code — cria instância + configura webhook automaticamente ─────────────
    const fetchQrCode = useCallback(async () => {
        if (!instanceName) return;
        setConnStatus("loading_qr"); setQrError(null);
        try {
            // Tenta criar instância (ignora erro se já existir)
            try {
                await evoFetch(`/instance/create`, {
                    method: "POST",
                    body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
                });

                // ✅ Configura webhook automaticamente logo após criar a instância
                await setupWebhook(instanceName);

            } catch { }

            // Usa GET para conectar (compatível com Evolution v2 na AWS)
            const data = await evoFetch(`/instance/connect/${instanceName}`, { method: "GET" });
            const base64 = data?.base64 ?? data?.qrcode?.base64 ?? data?.qr ?? data?.code;
            if (base64) {
                setQrCode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
                setConnStatus("qr_ready");
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = setInterval(checkConnection, 3000);
            } else {
                setQrError("QR Code não retornado pela API.");
                setConnStatus("disconnected");
            }
        } catch (err: any) {
            setQrError(`Erro: ${err.message}`);
            setConnStatus("disconnected");
        }
    }, [evoFetch, instanceName, checkConnection, setupWebhook]);

    useEffect(() => {
        if (!instanceName) return;
        let attempts = 0;
        const maxAttempts = 10;

        async function tryConnect() {
            attempts++;
            await checkConnection();
            if (attempts >= maxAttempts && connStatus === "checking") {
                if (pollRef.current) clearInterval(pollRef.current);
                setConnStatus("disconnected");
            }
        }

        tryConnect();
        pollRef.current = setInterval(() => {
            if (attempts >= maxAttempts) {
                if (pollRef.current) clearInterval(pollRef.current);
                return;
            }
            tryConnect();
        }, 3000);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [instanceName, checkConnection]);

    useEffect(() => {
        if (connStatus === "connected" && instanceName && userId)
            fetchConversas(instanceName, userId);
    }, [connStatus, instanceName, userId, fetchConversas]);

    useEffect(() => {
        if (!selectedConversa || !instanceName || connStatus !== "connected") return;
        fetchMensagens(selectedConversa, instanceName);
        msgPollRef.current = setInterval(() => fetchMensagens(selectedConversa, instanceName), 8000);
        return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
    }, [selectedConversa, instanceName, connStatus, fetchMensagens]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

    // ─── Muda status ──────────────────────────────────────────────────────────────
    async function changeStatus(jid: string, status: TabStatus) {
        if (!userId) return;
        setStatusMap((prev) => ({ ...prev, [jid]: status }));
        setConversas((prev) => prev.map((c) => c.remoteJid === jid ? { ...c, status } : c));
        if (selectedConversa?.remoteJid === jid)
            setSelectedConversa((prev) => prev ? { ...prev, status } : prev);
        await saveStatus(userId, jid, status);
    }

    // ─── Enviar mensagem ──────────────────────────────────────────────────────────
    async function handleSend() {
        if (!selectedConversa || !message.trim() || !instanceName) return;
        setSending(true);
        const phone = selectedConversa.remoteJid.replace("@s.whatsapp.net", "");
        const text = message;
        setMessage("");
        setMensagens((prev) => [...prev, {
            id: `temp-${Date.now()}`, mensagem: text, from_me: true, timestamp: Date.now() / 1000,
        }]);
        try {
            await evoFetch(`/message/sendText/${instanceName}`, {
                method: "POST",
                body: JSON.stringify({ number: phone, text }),
            });
            setTimeout(() => fetchMensagens(selectedConversa, instanceName), 1500);
        } catch {
            toast.error("Erro ao enviar. Abrindo WhatsApp Web...");
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
        }
        setSending(false);
        setShowTemplates(false);
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
                            <><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /><p className="text-gray-500 text-sm">Gerando QR Code...</p></>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <QrCode className="w-5 h-5" /><span className="font-semibold">Conectar WhatsApp</span>
                                </div>
                                {qrCode && <div className="p-3 bg-white border rounded-xl"><img src={qrCode} alt="QR Code" className="w-52 h-52" /></div>}
                                <div className="text-center space-y-1">
                                    <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">Escaneie com seu celular</p>
                                    <p className="text-gray-400 text-xs">WhatsApp → Menu (⋮) → Dispositivos conectados</p>
                                </div>
                                {qrError && <p className="text-red-500 text-xs">{qrError}</p>}
                                <button onClick={fetchQrCode} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Gerar novo QR Code
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="ml-16 flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-8 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Inbox</h1>
                            <p className="text-xs text-gray-400">
                                {instanceName
                                    ? `${conversas.length} conversa${conversas.length !== 1 ? "s" : ""} · ${instanceName}`
                                    : "Carregando..."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {connStatus === "checking" && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...
                            </span>
                        )}
                        {connStatus === "connected" && (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                                <Wifi className="w-3.5 h-3.5" /> Conectado
                            </span>
                        )}
                        {connStatus === "disconnected" && (
                            <button onClick={fetchQrCode} className="flex items-center gap-1.5 text-xs text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                                <WifiOff className="w-3.5 h-3.5" /> Reconectar
                            </button>
                        )}
                        <button
                            onClick={() => instanceName && userId && fetchConversas(instanceName, userId)}
                            disabled={loadingConversas}
                            title={debugInfo}
                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingConversas ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Debug bar */}
                {debugInfo && connStatus === "connected" && conversas.length === 0 && !loadingConversas && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 px-8 py-2">
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-mono">{debugInfo}</span>
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden p-5 gap-5">
                    {/* Lista */}
                    <div className="w-80 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col shadow-sm shrink-0 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-[#2a2f45] px-2 pt-2 gap-0.5">
                            {TAB_CONFIG.map(({ key, label, dot, active }) => {
                                const count = countByTab(key);
                                const isActive = activeTab === key;
                                return (
                                    <button key={key} onClick={() => setActiveTab(key)}
                                        className={`flex-1 flex flex-col items-center pb-2.5 pt-2 text-[11px] font-medium rounded-t-lg transition-all relative
                      ${isActive ? active : "text-gray-400 hover:text-gray-600"}`}
                                    >
                                        <div className="flex items-center gap-1">
                                            {isActive && <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
                                            <span className="whitespace-nowrap">{label}</span>
                                        </div>
                                        {count > 0 && (
                                            <span className={`mt-0.5 inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-full text-[9px] font-bold
                        ${isActive ? `${dot} text-white` : "bg-gray-100 dark:bg-[#2a2f45] text-gray-500"}`}>
                                                {count}
                                            </span>
                                        )}
                                        {isActive && <span className={`absolute bottom-0 left-2 right-2 h-0.5 ${dot} rounded-full`} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="px-3 py-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Lista conversas */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">
                            {loadingConversas && (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                                    <p className="text-xs text-gray-400">Carregando...</p>
                                </div>
                            )}
                            {!loadingConversas && filteredConversas.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
                                    {connStatus !== "connected" ? (
                                        <>
                                            <WifiOff className="w-8 h-8 text-red-300" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-500">WhatsApp desconectado</p>
                                                <button onClick={fetchQrCode} className="text-xs text-blue-500 hover:underline mt-1">Conectar agora</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                            <p className="text-xs text-gray-400">
                                                Nenhuma conversa em <strong>{TAB_CONFIG.find(t => t.key === activeTab)?.label}</strong>
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                            {filteredConversas.map((conv) => {
                                const isSelected = selectedConversa?.remoteJid === conv.remoteJid;
                                return (
                                    <button key={conv.remoteJid} onClick={() => setSelectedConversa(conv)}
                                        className={`w-full text-left px-3 py-3.5 border-b border-gray-50 dark:border-[#1e2236] transition-all flex items-center gap-3
                      ${isSelected ? "bg-blue-50 dark:bg-[#1e2d4a] border-l-2 border-l-blue-500" : "hover:bg-gray-50 dark:hover:bg-[#22263a]"}`}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                            style={{ backgroundColor: getAvatarColor(conv.remoteJid) }}>
                                            {getInitials(conv.nomeContato)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <p className={`font-semibold text-sm truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-100"}`}>{conv.nomeContato}</p>
                                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTimestamp(conv.timestamp)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className="text-xs text-gray-400 truncate">
                                                    {conv.fromMe && <CheckCheck className="w-3 h-3 inline mr-0.5 text-blue-400" />}
                                                    {conv.ultimaMensagem}
                                                </p>
                                                {conv.unread > 0 && (
                                                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">{conv.unread}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat */}
                    {selectedConversa ? (
                        <div className="flex-1 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2a2f45] flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                    style={{ backgroundColor: getAvatarColor(selectedConversa.remoteJid) }}>
                                    {getInitials(selectedConversa.nomeContato)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{selectedConversa.nomeContato}</p>
                                    <p className="text-xs text-gray-400">{selectedConversa.telefone}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium
                    ${selectedConversa.status === "pendentes" ? "bg-amber-50 text-amber-600" : ""}
                    ${selectedConversa.status === "atendimento" ? "bg-blue-50 text-blue-600" : ""}
                    ${selectedConversa.status === "fechados" ? "bg-gray-100 text-gray-500" : ""}
                  `}>{TAB_CONFIG.find(t => t.key === selectedConversa.status)?.label}</span>

                                    {selectedConversa.status === "pendentes" && (
                                        <button onClick={() => changeStatus(selectedConversa.remoteJid, "atendimento")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                                            <ArrowLeftRight className="w-3 h-3" /> Iniciar
                                        </button>
                                    )}
                                    {selectedConversa.status === "atendimento" && (
                                        <button onClick={() => changeStatus(selectedConversa.remoteJid, "fechados")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
                                            <X className="w-3 h-3" /> Fechar
                                        </button>
                                    )}
                                    {selectedConversa.status === "fechados" && (
                                        <button onClick={() => changeStatus(selectedConversa.remoteJid, "pendentes")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors">
                                            Reabrir
                                        </button>
                                    )}
                                    <button className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2 bg-[#f5f6fa] dark:bg-[#13161f] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">
                                {mensagens.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                        <MessageCircle className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                                        <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                                    </div>
                                )}
                                {mensagens.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.from_me ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm shadow-sm
                      ${msg.from_me ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-[#22263a] text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-[#2a2f45]"}`}>
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.mensagem}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.from_me ? "text-blue-200/70" : "text-gray-400"}`}>
                                                {msg.timestamp ? format(new Date(msg.timestamp * 1000), "HH:mm") : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {templates.length > 0 && showTemplates && (
                                <div className="px-5 py-2 border-t border-gray-100 dark:border-[#2a2f45] bg-white dark:bg-[#1a1d27]">
                                    <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Respostas rápidas</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {templates.map((t) => (
                                            <button key={t.id} onClick={() => { setMessage(t.mensagem); setShowTemplates(false); }}
                                                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#22263a] hover:bg-blue-50 hover:text-blue-600 border border-gray-200 dark:border-[#2a2f45] rounded-full text-gray-600 transition-colors whitespace-nowrap">
                                                {t.titulo}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="px-5 py-4 border-t border-gray-100 dark:border-[#2a2f45] bg-white dark:bg-[#1a1d27] flex items-end gap-3">
                                <div className="flex items-center gap-1.5 text-gray-400 pb-1">
                                    <button className="hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors"><Smile className="w-5 h-5" /></button>
                                    <button className="hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors"><Paperclip className="w-5 h-5" /></button>
                                    {templates.length > 0 && (
                                        <button onClick={() => setShowTemplates(!showTemplates)}
                                            className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors ${showTemplates ? "text-blue-500" : "hover:text-gray-600"}`}>
                                            <Tag className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <Textarea placeholder="Digite uma mensagem..." value={message}
                                    onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} rows={1}
                                    className="flex-1 bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none focus:border-blue-300 text-sm rounded-xl transition-colors"
                                />
                                {message.trim() ? (
                                    <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700 text-white h-9 w-9 p-0 shrink-0 rounded-full">
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                ) : (
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 pb-1"><Mic className="w-5 h-5" /></button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col items-center justify-center shadow-sm gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Selecione uma conversa</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {connStatus === "connected"
                                        ? `${filteredConversas.length} conversa${filteredConversas.length !== 1 ? "s" : ""} em ${TAB_CONFIG.find(t => t.key === activeTab)?.label}`
                                        : "Conecte o WhatsApp para ver as conversas"}
                                </p>
                            </div>
                            {connStatus === "disconnected" && (
                                <button onClick={fetchQrCode} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl transition-colors">
                                    <QrCode className="w-4 h-4" /> Conectar WhatsApp
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsApp;