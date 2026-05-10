import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Send, Users, MessageCircle, CheckSquare, Search,
    Loader2, AlertCircle, CheckCircle2, Zap, RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { leadService } from "@/services/lead.service";

const PROXY = `${import.meta.env.VITE_API_URL}/api/v1/whatsapp/evolution`;
const DAILY_LIMIT = 10;

interface Lead {
    id: string;
    name: string;
    telefone: string;
    interesse?: string;
    status?: string;
}

interface DisparoLog {
    lead_id: string;
    lead_name: string;
    phone: string;
    sent_at: string;
    success: boolean;
    message_preview: string;
}

function formatPhoneForEvo(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("55") ? digits : `55${digits}`;
}

const messageTemplates = [
    {
        label: "Apresentação",
        text: "Olá {nome}! Tudo bem? Vi que você tem interesse em {interesse}. Posso te ajudar a encontrar o imóvel ideal! 🏠",
    },
    {
        label: "Follow-up",
        text: "Oi {nome}! Passando para saber se você ainda está buscando {interesse}. Tenho novas opções que podem te interessar! 😊",
    },
    {
        label: "Agendamento",
        text: "Olá {nome}! Gostaria de agendar uma visita para conhecer opções de {interesse}? Tenho horários disponíveis essa semana! 📅",
    },
    {
        label: "Oferta",
        text: "Oi {nome}! Tenho uma condição especial para {interesse}. Quer saber mais detalhes? É por tempo limitado! 🔥",
    },
];

const statusColors: Record<string, string> = {
    novo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    contato: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    visitou: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    proposta: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    fechado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    perdido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
    novo: "Novo", contato: "Em Contato", visitou: "Visitou",
    proposta: "Proposta", fechado: "Fechado", perdido: "Perdido",
};

const avatarColors = [
    "#4F86F7", "#7C5CBF", "#E05FA0",
    "#F4874B", "#2BBFA4", "#5B6FD6",
    "#E05555", "#29B8D4", "#3DBD7D", "#F0B429",
];

function getAvatarColor(id: string) {
    const sum = id.replace(/-/g, "").split("").reduce((acc, c) => acc + (parseInt(c) || 0), 0);
    return avatarColors[sum % avatarColors.length];
}

function getInitials(name: string) {
    const clean = name.trim();
    if (!clean) return "?";
    return clean.split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();
}

const Disparo = () => {
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);

    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [message, setMessage] = useState(messageTemplates[0].text);
    const [searchTerm, setSearchTerm] = useState("");
    const [sending, setSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [disparosHoje, setDisparosHoje] = useState(0);
    const [logs, setLogs] = useState<DisparoLog[]>([]);
    const [resultados, setResultados] = useState<{ success: number; fail: number } | null>(null);
    const [connStatus, setConnStatus] = useState<"checking" | "connected" | "disconnected">("checking");

    const instanceName = user ? `inst-${user.id.split("-")[0]}` : null;

    const evoFetch = useCallback(async (path: string, options?: RequestInit) => {
        const cleanPath = path.startsWith("/") ? path.slice(1) : path;
        const res = await fetch(`${PROXY}/${cleanPath}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(options?.headers ?? {}),
            },
        });
        const text = await res.text();
        try { return { ok: res.ok, data: JSON.parse(text) }; } catch { return { ok: res.ok, data: null }; }
    }, [accessToken]);

    useEffect(() => {
        if (!instanceName) return;
        async function checkConn() {
            try {
                const { data } = await evoFetch(`/instance/connectionState/${instanceName}`);
                const state = data?.instance?.state ?? data?.state;
                setConnStatus(state === "open" ? "connected" : "disconnected");
            } catch {
                setConnStatus("disconnected");
            }
        }
        checkConn();
    }, [instanceName, evoFetch]);

    useEffect(() => {
        setLoadingLeads(true);
        leadService.getAll().then((data) => {
            setLeads(data.filter((l) => l.telefone));
            setLoadingLeads(false);
        }).catch(() => setLoadingLeads(false));
    }, []);

    const remaining = DAILY_LIMIT - disparosHoje;
    const canSelect = Math.max(0, remaining);
    const limitReached = disparosHoje >= DAILY_LIMIT;

    const filteredLeads = leads.filter(
        (l) =>
            (l.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.telefone ?? "").includes(searchTerm) ||
            (l.interesse ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked && selectedIds.length < canSelect) {
            setSelectedIds((p) => [...p, id]);
        } else if (!checked) {
            setSelectedIds((p) => p.filter((i) => i !== id));
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === Math.min(filteredLeads.length, canSelect)) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredLeads.slice(0, canSelect).map((l) => l.id));
        }
    };

    const personalizeMsg = (lead: Lead) =>
        message
            .replace(/\{nome\}/g, (lead.name ?? "").split(" ")[0] ?? "")
            .replace(/\{interesse\}/g, lead.interesse ?? "imóvel");

    const handleDisparo = async () => {
        if (!instanceName || selectedIds.length === 0 || limitReached) return;

        const selectedLeads = leads.filter((l) => selectedIds.includes(l.id));
        setSending(true);
        setSendingProgress(0);
        setResultados(null);

        let success = 0;
        let fail = 0;
        const newLogs: DisparoLog[] = [];

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            const phone = formatPhoneForEvo(lead.telefone);
            const text = personalizeMsg(lead);

            try {
                const { ok } = await evoFetch(`/message/sendText/${instanceName}`, {
                    method: "POST",
                    body: JSON.stringify({ number: phone, text }),
                });
                ok ? success++ : fail++;
                newLogs.push({
                    lead_id: lead.id, lead_name: lead.name,
                    phone: lead.telefone, success: ok,
                    message_preview: text.slice(0, 120),
                    sent_at: new Date().toISOString(),
                });
            } catch {
                fail++;
                newLogs.push({
                    lead_id: lead.id, lead_name: lead.name,
                    phone: lead.telefone, success: false,
                    message_preview: text.slice(0, 120),
                    sent_at: new Date().toISOString(),
                });
            }

            setSendingProgress(i + 1);
            if (i < selectedLeads.length - 1) {
                await new Promise((r) => setTimeout(r, 1800));
            }
        }

        setResultados({ success, fail });
        setSelectedIds([]);
        setSending(false);
        setDisparosHoje((p) => p + success);
        setLogs((p) => [...newLogs, ...p].slice(0, 50));
    };

    const selectedLeads = leads.filter((l) => selectedIds.includes(l.id));
    const previewLead = selectedLeads[0] ?? filteredLeads[0];

    return (
        <div className="h-screen flex bg-[#f5f6fa] dark:bg-[#0f1117] overflow-hidden transition-colors duration-200">
            <Sidebar />

            <div className="md:ml-16 flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="h-16 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-8 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Disparo WhatsApp</h1>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Envio em massa</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium
                            ${connStatus === "connected"
                                ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                : connStatus === "disconnected"
                                    ? "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-gray-100 text-gray-400 dark:bg-[#22263a] dark:text-gray-500"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connStatus === "connected" ? "bg-green-500" : connStatus === "disconnected" ? "bg-red-500" : "bg-gray-400"}`} />
                            {connStatus === "connected" ? "Conectado" : connStatus === "disconnected" ? "Desconectado" : "Verificando..."}
                        </span>

                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            ${limitReached
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}>
                            <Send className="w-3.5 h-3.5" />
                            {disparosHoje}/{DAILY_LIMIT} disparos hoje
                        </div>

                        <button
                            onClick={() => {
                                if (!instanceName) return;
                                evoFetch(`/instance/connectionState/${instanceName}`)
                                    .then(({ data }) => {
                                        const state = data?.instance?.state ?? data?.state;
                                        setConnStatus(state === "open" ? "connected" : "disconnected");
                                    })
                                    .catch(() => setConnStatus("disconnected"));
                            }}
                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-5">

                    {limitReached && (
                        <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>Limite diário de <strong>{DAILY_LIMIT} disparos</strong> atingido. Volte amanhã para continuar.</span>
                        </div>
                    )}

                    {connStatus === "disconnected" && (
                        <div className="mb-4 flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>WhatsApp desconectado. Acesse a página de <strong>Chat WhatsApp</strong> para reconectar antes de disparar.</span>
                        </div>
                    )}

                    {resultados && (
                        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl text-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                            <span className="text-green-700 dark:text-green-400">
                                Disparo concluído! <strong>{resultados.success} enviados</strong>
                                {resultados.fail > 0 && <span className="text-red-500"> · {resultados.fail} falhas</span>}
                            </span>
                            <button onClick={() => setResultados(null)} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">Fechar</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                        {/* Coluna esquerda: leads */}
                        <div className="xl:col-span-2 space-y-4">

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { icon: Users, label: "Total de leads", value: leads.length, color: "blue" },
                                    { icon: CheckSquare, label: "Selecionados", value: selectedIds.length, color: "green" },
                                    { icon: MessageCircle, label: "Restam hoje", value: canSelect, color: limitReached ? "red" : "purple" },
                                ].map(({ icon: Icon, label, value, color }) => (
                                    <div key={label} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] p-4 flex items-center gap-3 shadow-sm">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                            ${color === "blue" ? "bg-blue-50 dark:bg-blue-900/20" :
                                                color === "green" ? "bg-green-50 dark:bg-green-900/20" :
                                                    color === "red" ? "bg-red-50 dark:bg-red-900/20" :
                                                        "bg-purple-50 dark:bg-purple-900/20"}`}>
                                            <Icon className={`w-5 h-5
                                                ${color === "blue" ? "text-blue-600 dark:text-blue-400" :
                                                    color === "green" ? "text-green-600 dark:text-green-400" :
                                                        color === "red" ? "text-red-500 dark:text-red-400" :
                                                            "text-purple-600 dark:text-purple-400"}`} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        placeholder="Buscar por nome, telefone ou interesse..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleSelectAll}
                                    disabled={limitReached || canSelect === 0}
                                    className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {selectedIds.length === Math.min(filteredLeads.length, canSelect) && selectedIds.length > 0
                                        ? "Desmarcar todos"
                                        : `Selecionar (máx. ${canSelect})`}
                                </button>
                            </div>

                            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm overflow-hidden">
                                <div className="max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                                    {loadingLeads ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                                        </div>
                                    ) : filteredLeads.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                                            <Users className="w-8 h-8 text-gray-200 dark:text-gray-600" />
                                            <p className="text-sm text-gray-400">Nenhum lead encontrado</p>
                                        </div>
                                    ) : (
                                        filteredLeads.map((lead) => {
                                            const isSelected = selectedIds.includes(lead.id);
                                            const isDisabled = !isSelected && (selectedIds.length >= canSelect || limitReached);
                                            return (
                                                <label
                                                    key={lead.id}
                                                    className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-[#22263a] last:border-0 transition-all cursor-pointer
                                                        ${isSelected
                                                            ? "bg-blue-50 dark:bg-[#1e2d4a] border-l-2 border-l-blue-500"
                                                            : isDisabled
                                                                ? "opacity-40 cursor-not-allowed"
                                                                : "hover:bg-gray-50 dark:hover:bg-[#22263a]"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isDisabled}
                                                        onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                                                        className="w-4 h-4 rounded accent-blue-500 shrink-0"
                                                    />
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                        style={{ backgroundColor: getAvatarColor(lead.id) }}
                                                    >
                                                        {getInitials(lead.name ?? "")}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{lead.name}</p>
                                                            {lead.status && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColors[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                                    {statusLabels[lead.status] ?? lead.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-xs text-gray-400">{lead.telefone}</p>
                                                            {lead.interesse && <p className="text-xs text-gray-400 truncate">· {lead.interesse}</p>}
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Coluna direita: mensagem + preview + histórico */}
                        <div className="space-y-4">

                            {/* Templates */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm p-4 space-y-3">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Template</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {messageTemplates.map((t) => (
                                        <button
                                            key={t.label}
                                            onClick={() => setMessage(t.text)}
                                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                                                ${message === t.text
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "bg-gray-50 dark:bg-[#22263a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#2a2f45] hover:border-blue-300"
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    className="w-full text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl px-3 py-2.5 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 resize-none transition-colors"
                                    placeholder="Digite sua mensagem..."
                                />
                            </div>

                            {/* Preview */}
                            {previewLead && (
                                <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm p-4 space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Preview</p>
                                    <div className="bg-[#dcf8c6] dark:bg-emerald-900/30 rounded-xl rounded-br-sm px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                                        {personalizeMsg(previewLead)}
                                    </div>
                                    <p className="text-[10px] text-gray-400">Para: {previewLead.name}</p>
                                </div>
                            )}

                            {/* Disparar */}
                            <button
                                onClick={handleDisparo}
                                disabled={sending || selectedIds.length === 0 || limitReached || connStatus !== "connected"}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-green-500/20"
                            >
                                {sending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando {sendingProgress}/{selectedIds.length}...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Disparar para {selectedIds.length} lead{selectedIds.length !== 1 ? "s" : ""}</>
                                )}
                            </button>

                            {/* Histórico da sessão */}
                            {logs.length > 0 && (
                                <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm p-4 space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Histórico da sessão</p>
                                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                                        {logs.map((log, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                {log.success
                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                    : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                }
                                                <span className="text-gray-600 dark:text-gray-300 truncate">{log.lead_name}</span>
                                                <span className="text-gray-400 shrink-0">{log.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Disparo;
