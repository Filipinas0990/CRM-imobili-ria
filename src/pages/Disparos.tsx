import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Send, Users, MessageCircle, CheckSquare, Search,
    Loader2, AlertCircle, CheckCircle2, Zap, RefreshCw,
    ChevronRight, Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/evolution-proxy`;
const DAILY_LIMIT = 10;

// ── Types ──────────────────────────────────────────────────────────────────
interface Lead {
    id: string;
    nome: string;
    telefone: string;
    interesse?: string;
    status?: string;
}

interface DisparoLog {
    id: string;
    lead_id: string;
    lead_name: string;
    phone: string;
    sent_at: string;
    success: boolean;
    message_preview: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────────────────
const Disparo = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [message, setMessage] = useState(messageTemplates[0].text);
    const [searchTerm, setSearchTerm] = useState("");
    const [sending, setSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [disparosHoje, setDisparosHoje] = useState(0);
    const [logs, setLogs] = useState<DisparoLog[]>([]);
    const [resultados, setResultados] = useState<{ success: number; fail: number } | null>(null);
    const [connStatus, setConnStatus] = useState<"checking" | "connected" | "disconnected">("checking");

    // ── Init ──────────────────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const instName = `inst-${user.id.slice(0, 8)}`;
            const { data: inst } = await supabase
                .from("whatsapp_instancias")
                .select("instance_name")
                .eq("user_id", user.id)
                .single();
            setInstanceName(inst?.instance_name ?? instName);

            // Buscar leads
            setLoadingLeads(true);
            const { data: leadsData } = await supabase
                .from("leads")
                .select("id, nome, telefone, interesse, status")
                .not("telefone", "is", null)
                .order("criado_em", { ascending: false });
            setLeads(leadsData ?? []);
            setLoadingLeads(false);

            // Disparos de hoje (global)
            await fetchDisparosHoje();
        }
        init();
    }, []);

    // Check connection
    useEffect(() => {
        if (!instanceName) return;
        async function checkConn() {
            try {
                const res = await fetch(
                    `${PROXY_URL}?path=${encodeURIComponent(`/instance/connectionState/${instanceName}`)}`,
                    { headers: { "Content-Type": "application/json" } }
                );
                const data = await res.json();
                const state = data?.instance?.state ?? data?.state;
                setConnStatus(state === "open" ? "connected" : "disconnected");
            } catch {
                setConnStatus("disconnected");
            }
        }
        checkConn();
    }, [instanceName]);

    const fetchDisparosHoje = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const hoje = new Date().toISOString().split("T")[0];

        // Contagem global do dia (todos os usuários) para o limite de 10/dia
        const { count } = await supabase
            .from("disparo_logs")
            .select("*", { count: "exact", head: true })
            .gte("sent_at", `${hoje}T00:00:00`)
            .lte("sent_at", `${hoje}T23:59:59`);
        setDisparosHoje(count ?? 0);

        // Logs do usuário logado (RLS já filtra automaticamente)
        const { data } = await supabase
            .from("disparo_logs")
            .select("*")
            .gte("sent_at", `${hoje}T00:00:00`)
            .order("sent_at", { ascending: false })
            .limit(20);
        setLogs(data ?? []);
    }, []);

    // ── Selection ─────────────────────────────────────────────────────────
    const remaining = DAILY_LIMIT - disparosHoje;
    const canSelect = Math.max(0, remaining);

    const filteredLeads = leads.filter(
        (l) =>
            l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.telefone?.includes(searchTerm) ||
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

    // ── Personalise ───────────────────────────────────────────────────────
    const personalizeMsg = (lead: Lead) =>
        message
            .replace(/\{nome\}/g, lead.nome?.split(" ")[0] ?? "")
            .replace(/\{interesse\}/g, lead.interesse ?? "imóvel");

    // ── Send ──────────────────────────────────────────────────────────────
    const handleDisparo = async () => {
        if (!instanceName || selectedIds.length === 0) return;
        if (disparosHoje >= DAILY_LIMIT) return;

        const selectedLeads = leads.filter((l) => selectedIds.includes(l.id));
        setSending(true);
        setSendingProgress(0);
        setResultados(null);

        let success = 0;
        let fail = 0;

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            const phone = formatPhoneForEvo(lead.telefone);
            const text = personalizeMsg(lead);

            try {
                const res = await fetch(
                    `${PROXY_URL}?path=${encodeURIComponent(`/message/sendText/${instanceName}`)}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ number: phone, text }),
                    }
                );
                const ok = res.ok;
                ok ? success++ : fail++;

                // Salvar log com user_id (exigido pelo RLS)
                await supabase.from("disparo_logs").insert({
                    user_id: userId,
                    lead_id: lead.id,
                    lead_name: lead.nome,
                    phone: lead.telefone,
                    success: ok,
                    message_preview: text.slice(0, 120),
                    sent_at: new Date().toISOString(),
                });
            } catch {
                fail++;
                await supabase.from("disparo_logs").insert({
                    user_id: userId,
                    lead_id: lead.id,
                    lead_name: lead.nome,
                    phone: lead.telefone,
                    success: false,
                    message_preview: text.slice(0, 120),
                    sent_at: new Date().toISOString(),
                });
            }

            setSendingProgress(i + 1);

            // Delay entre mensagens para evitar bloqueio
            if (i < selectedLeads.length - 1) {
                await new Promise((r) => setTimeout(r, 1800));
            }
        }

        setResultados({ success, fail });
        setSelectedIds([]);
        setSending(false);
        await fetchDisparosHoje();
    };

    // ── UI ────────────────────────────────────────────────────────────────
    const selectedLeads = leads.filter((l) => selectedIds.includes(l.id));
    const previewLead = selectedLeads[0] ?? filteredLeads[0];
    const limitReached = disparosHoje >= DAILY_LIMIT;

    return (
        <div className="h-screen flex bg-[#f5f6fa] dark:bg-[#0f1117] overflow-hidden transition-colors duration-200">
            <Sidebar />

            <div className="ml-16 flex-1 flex flex-col overflow-hidden">

                {/* ── Header ── */}
                <div className="h-16 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-8 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Disparo WhatsApp</h1>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Portum</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Connection badge */}
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

                        {/* Daily counter */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            ${limitReached
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}>
                            <Send className="w-3.5 h-3.5" />
                            {disparosHoje}/{DAILY_LIMIT} disparos hoje
                        </div>

                        <button
                            onClick={fetchDisparosHoje}
                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-auto p-5">

                    {/* Limit alert */}
                    {limitReached && (
                        <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>Limite diário de <strong>{DAILY_LIMIT} disparos</strong> atingido. Volte amanhã para continuar.</span>
                        </div>
                    )}

                    {/* Disconnected alert */}
                    {connStatus === "disconnected" && (
                        <div className="mb-4 flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>WhatsApp desconectado. Acesse a página de <strong>Chat WhatsApp</strong> para reconectar antes de disparar.</span>
                        </div>
                    )}

                    {/* Result banner */}
                    {resultados && (
                        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl text-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                            <span className="text-green-700 dark:text-green-400">
                                Disparo concluído! <strong>{resultados.success} enviados</strong>
                                {resultados.fail > 0 && <span className="text-red-500"> · {resultados.fail} falhas</span>}
                            </span>
                            <button onClick={() => setResultados(null)} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">Fechar</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                        {/* ── Left: Lead list ── */}
                        <div className="xl:col-span-2 space-y-4">

                            {/* Stats row */}
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

                            {/* Search + select all */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        placeholder="Buscar por nome, telefone ou interesse..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-300 dark:focus:border-blue-500 transition-colors"
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

                            {/* Leads table */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm overflow-hidden">
                                <div className="max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                                    {loadingLeads ? (
                                        <div className="flex justify-center items-center py-12">
                                            <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin" />
                                        </div>
                                    ) : filteredLeads.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                                            <Users className="w-8 h-8 text-gray-200 dark:text-gray-600" />
                                            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum lead encontrado</p>
                                        </div>
                                    ) : (
                                        filteredLeads.map((lead) => {
                                            const isSelected = selectedIds.includes(lead.id);
                                            const isDisabled = !isSelected && (selectedIds.length >= canSelect || limitReached);
                                            return (
                                                <label
                                                    key={lead.id}
                                                    className={`flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-[#22263a] last:border-0 transition-colors cursor-pointer
                                                        ${isSelected ? "bg-blue-50/60 dark:bg-[#1e2d4a]" : isDisabled ? "opacity-40" : "hover:bg-gray-50 dark:hover:bg-[#22263a]"}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isDisabled}
                                                        onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                                                        className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold text-sm ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-100"}`}>
                                                            {lead.nome}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                            {lead.telefone}{lead.interesse ? ` · ${lead.interesse}` : ""}
                                                        </p>
                                                    </div>
                                                    {lead.status && (
                                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                            {statusLabels[lead.status] ?? lead.status}
                                                        </span>
                                                    )}
                                                    {isSelected && <ChevronRight className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Message + send ── */}
                        <div className="space-y-4">

                            {/* Message card */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm p-5 space-y-4">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Mensagem</h2>

                                {/* Templates */}
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Templates rápidos</p>
                                    <div className="flex flex-wrap gap-2">
                                        {messageTemplates.map((t) => (
                                            <button
                                                key={t.label}
                                                onClick={() => setMessage(t.text)}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                                                    ${message === t.text
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea */}
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Sua mensagem</p>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        rows={5}
                                        className="w-full text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-300 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1d27] resize-none transition-colors"
                                    />
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Use <code className="font-mono bg-gray-100 dark:bg-[#22263a] px-1 rounded">{"{nome}"}</code> e <code className="font-mono bg-gray-100 dark:bg-[#22263a] px-1 rounded">{"{interesse}"}</code> para personalizar
                                    </p>
                                </div>

                                {/* Preview */}
                                {previewLead && (
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Preview</p>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {personalizeMsg(previewLead)}
                                        </div>
                                    </div>
                                )}

                                {/* Progress */}
                                {sending && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</span>
                                            <span>{sendingProgress} / {selectedLeads.length}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-[#22263a] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${(sendingProgress / selectedLeads.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                <button
                                    onClick={handleDisparo}
                                    disabled={sending || selectedIds.length === 0 || limitReached || connStatus !== "connected"}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Iniciar Disparo ({selectedIds.length})</>
                                    )}
                                </button>
                            </div>

                            {/* How it works */}
                            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Como funciona?</h3>
                                <ol className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    {[
                                        "Selecione até 10 leads por dia",
                                        "Escolha ou personalize a mensagem",
                                        'Clique em "Iniciar Disparo"',
                                        "As mensagens são enviadas via Evolution API",
                                        "Acompanhe os logs abaixo",
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* ── Logs ── */}
                    {logs.length > 0 && (
                        <div className="mt-5 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Log de Disparos de Hoje</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-[#2a2f45]">
                                            {["Lead", "Telefone", "Horário", "Preview", "Status"].map((h) => (
                                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b border-gray-50 dark:border-[#22263a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors">
                                                <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">{log.lead_name}</td>
                                                <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{log.phone}</td>
                                                <td className="px-5 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {new Date(log.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                </td>
                                                <td className="px-5 py-3 text-gray-400 dark:text-gray-500 max-w-xs truncate">{log.message_preview}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium
                                                        ${log.success
                                                            ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                                            : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                                                        }`}>
                                                        {log.success ? <><CheckCircle2 className="w-3 h-3" /> Enviado</> : <><AlertCircle className="w-3 h-3" /> Falhou</>}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Disparo;