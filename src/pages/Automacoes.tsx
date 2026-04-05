import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Plus, Play, Pause, Save, X,
    Zap, CheckCircle, ArrowRight, Edit2, Trash2, Loader2,
    Settings, List, HelpCircle, PhoneCall, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type NodeType = "start" | "message" | "menu" | "question" | "transfer" | "end";
type FluxoStatus = "ativo" | "rascunho";
type TriggerType = "always" | "first_contact" | "off_hours";

interface MenuOption {
    number: number;
    label: string;
    next_node_id?: string;
}

interface FluxoNo {
    id: string;
    type: NodeType;
    label: string;
    message: string;
    order_index: number;
    next_node_id?: string;
    delay_seconds?: number;
    x: number;
    y: number;
    // Menu
    options?: MenuOption[];
    // Pergunta
    variable_name?: string;
    // Transferir
    transfer_message?: string;
}

interface Fluxo {
    id: string;
    nome: string;
    status: FluxoStatus;
    trigger_type: TriggerType;
    instance_name: string;
    restart_after_hours: number;
    nos: FluxoNo[];
}

function uid() { return crypto.randomUUID(); }

// ─── Config visual dos nós ────────────────────────────────────────────────────
const NODE_CONFIG: Record<NodeType, { bg: string; border: string; icon: string; label: string; Icon: any }> = {
    start: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-400", icon: "text-amber-500", label: "Início", Icon: Zap },
    message: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-400", icon: "text-blue-500", label: "Mensagem", Icon: Settings },
    menu: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-400", icon: "text-purple-500", label: "Menu", Icon: List },
    question: { bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-400", icon: "text-cyan-500", label: "Pergunta", Icon: HelpCircle },
    transfer: { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-400", icon: "text-orange-500", label: "Transferir", Icon: PhoneCall },
    end: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-400", icon: "text-red-500", label: "Finalizar", Icon: CheckCircle },
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
    always: "Sempre que receber mensagem",
    first_contact: "Apenas no primeiro contato",
    off_hours: "Fora do horário comercial",
};

const ADDABLE_NODES: NodeType[] = ["message", "menu", "question", "transfer"];

// ─── Card do nó ───────────────────────────────────────────────────────────────
const NoCard = ({ no, selected, onSelect, onEdit, onDelete, onConnect, connecting }: {
    no: FluxoNo; selected: boolean;
    onSelect: () => void; onEdit: () => void;
    onDelete: () => void; onConnect: () => void;
    connecting: boolean;
}) => {
    const cfg = NODE_CONFIG[no.type];
    const Icon = cfg.Icon;
    const isDeletable = !["start", "end"].includes(no.type);

    return (
        <div
            className={`absolute w-60 rounded-2xl border-2 shadow-sm cursor-pointer select-none transition-all
                ${cfg.bg} ${cfg.border}
                ${selected ? "ring-2 ring-offset-2 ring-blue-500 shadow-md" : "hover:shadow-md"}
                ${connecting ? "ring-2 ring-purple-400" : ""}`}
            style={{ left: no.x, top: no.y }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${cfg.border} border-opacity-30`}>
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${cfg.icon}`} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="w-6 h-6 rounded-lg hover:bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-3 h-3" />
                    </button>
                    {isDeletable && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="w-6 h-6 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-3 py-2.5 space-y-1">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{no.label}</p>

                {no.message && (
                    <p className="text-[11px] text-gray-500 line-clamp-2">{no.message}</p>
                )}

                {/* Opções do menu */}
                {no.type === "menu" && no.options && no.options.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                        {no.options.map(opt => (
                            <p key={opt.number} className="text-[10px] text-purple-600 dark:text-purple-400">
                                {opt.number}. {opt.label}
                            </p>
                        ))}
                    </div>
                )}

                {/* Variável da pergunta */}
                {no.type === "question" && no.variable_name && (
                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400">
                        💾 Salva em: <strong>{`{{${no.variable_name}}}`}</strong>
                    </p>
                )}

                {/* Mensagem de transferência */}
                {no.type === "transfer" && no.transfer_message && (
                    <p className="text-[11px] text-orange-600 line-clamp-1">{no.transfer_message}</p>
                )}

                {(no.delay_seconds ?? 0) > 0 && (
                    <p className="text-[10px] text-blue-400">⏱ {no.delay_seconds}s de delay</p>
                )}
            </div>

            {/* Saída direita — apenas nós que não são menu e não são end */}
            {no.type !== "end" && no.type !== "menu" && (
                <button onClick={(e) => { e.stopPropagation(); onConnect(); }}
                    className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${no.next_node_id ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400"}`}>
                    <ArrowRight className="w-3 h-3" />
                </button>
            )}

            {/* Entrada esquerda */}
            {no.type !== "start" && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
            )}
        </div>
    );
};

// ─── Modal de edição ──────────────────────────────────────────────────────────
const NoEditModal = ({ no, allNodes, onSave, onClose }: {
    no: FluxoNo; allNodes: FluxoNo[];
    onSave: (n: FluxoNo) => void; onClose: () => void;
}) => {
    const [form, setForm] = useState<FluxoNo>({ ...no, options: no.options ? [...no.options] : [] });

    function addOption() {
        const num = (form.options?.length ?? 0) + 1;
        setForm(f => ({ ...f, options: [...(f.options ?? []), { number: num, label: "", next_node_id: undefined }] }));
    }

    function updateOption(idx: number, field: keyof MenuOption, value: any) {
        const opts = [...(form.options ?? [])];
        opts[idx] = { ...opts[idx], [field]: value };
        setForm(f => ({ ...f, options: opts }));
    }

    function removeOption(idx: number) {
        const opts = [...(form.options ?? [])].filter((_, i) => i !== idx).map((o, i) => ({ ...o, number: i + 1 }));
        setForm(f => ({ ...f, options: opts }));
    }

    const otherNodes = allNodes.filter(n => n.id !== no.id);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-lg my-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Editar — {NODE_CONFIG[form.type].label}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Título */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Título interno</label>
                        <input className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                            value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} />
                    </div>

                    {/* Mensagem principal */}
                    {["start", "message", "end", "menu", "question"].includes(form.type) && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                {form.type === "menu" ? "Texto do menu (antes das opções)" :
                                    form.type === "question" ? "Pergunta que o bot vai fazer" :
                                        "Mensagem que o bot vai enviar"}
                            </label>
                            <textarea rows={3}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 resize-none"
                                value={form.message}
                                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                                placeholder={
                                    form.type === "menu" ? "Ex: Como posso te ajudar? Escolha uma opção:" :
                                        form.type === "question" ? "Ex: Qual cidade você procura?" :
                                            "Digite a mensagem..."
                                } />
                        </div>
                    )}

                    {/* Opções do menu */}
                    {form.type === "menu" && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-gray-500">Opções do menu</label>
                                <button onClick={addOption}
                                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium">
                                    <Plus className="w-3 h-3" /> Adicionar opção
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(form.options ?? []).map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-[#22263a] rounded-xl p-2">
                                        <span className="text-xs font-bold text-purple-600 w-4">{opt.number}.</span>
                                        <input
                                            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:border-purple-400"
                                            placeholder="Ex: Comprar imóvel"
                                            value={opt.label}
                                            onChange={(e) => updateOption(idx, "label", e.target.value)} />
                                        <select
                                            className="text-xs bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-lg px-2 py-1 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-purple-400"
                                            value={opt.next_node_id ?? ""}
                                            onChange={(e) => updateOption(idx, "next_node_id", e.target.value || undefined)}>
                                            <option value="">→ Próximo nó</option>
                                            {otherNodes.map(n => (
                                                <option key={n.id} value={n.id}>{NODE_CONFIG[n.type].label}: {n.label}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {(form.options ?? []).length === 0 && (
                                    <p className="text-[11px] text-gray-400 text-center py-2">Nenhuma opção ainda. Clique em "+ Adicionar opção".</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Variável da pergunta */}
                    {form.type === "question" && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                Nome da variável para salvar a resposta
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">{"{{"}</span>
                                <input
                                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-cyan-400"
                                    placeholder="Ex: cidade, nome, telefone"
                                    value={form.variable_name ?? ""}
                                    onChange={(e) => setForm(f => ({ ...f, variable_name: e.target.value.toLowerCase().replace(/\s/g, "_") }))} />
                                <span className="text-sm text-gray-400">{"}}"}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                A resposta do cliente ficará disponível como {`{{${form.variable_name || "variavel"}}}`} nas mensagens seguintes.
                            </p>
                        </div>
                    )}

                    {/* Próximo nó da pergunta */}
                    {form.type === "question" && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Após receber a resposta, ir para:</label>
                            <select
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-cyan-400"
                                value={form.next_node_id ?? ""}
                                onChange={(e) => setForm(f => ({ ...f, next_node_id: e.target.value || undefined }))}>
                                <option value="">Selecione o próximo nó...</option>
                                {otherNodes.map(n => (
                                    <option key={n.id} value={n.id}>{NODE_CONFIG[n.type].label}: {n.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Transferir */}
                    {form.type === "transfer" && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                Mensagem antes de transferir (opcional)
                            </label>
                            <textarea rows={3}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-orange-400 resize-none"
                                value={form.transfer_message ?? ""}
                                onChange={(e) => setForm(f => ({ ...f, transfer_message: e.target.value }))}
                                placeholder="Ex: Aguarde, vou te conectar com um corretor! 🏡" />
                            <div className="mt-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                                <p className="text-[11px] text-orange-700 dark:text-orange-300">
                                    ⚠️ Este nó encerra o bot e transfere o atendimento para o corretor.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Delay */}
                    {!["menu", "transfer"].includes(form.type) && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                Delay antes de enviar (segundos)
                            </label>
                            <input type="number" min={0} max={30}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                value={form.delay_seconds ?? 2}
                                onChange={(e) => setForm(f => ({ ...f, delay_seconds: Number(e.target.value) }))} />
                            <p className="text-[10px] text-gray-400 mt-1">Recomendado: 2-5 segundos. Máximo: 30s.</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Modal de configurações ───────────────────────────────────────────────────
const ConfigModal = ({ fluxo, onSave, onClose }: {
    fluxo: Fluxo; onSave: (u: Partial<Fluxo>) => void; onClose: () => void;
}) => {
    const [trigger, setTrigger] = useState<TriggerType>(fluxo.trigger_type);
    const [restartHours, setRestartHours] = useState(fluxo.restart_after_hours ?? 24);
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configurações do bot</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-6 py-4 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Quando o bot deve responder?</label>
                        <select className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                            value={trigger} onChange={(e) => setTrigger(e.target.value as TriggerType)}>
                            {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Reiniciar fluxo após quantas horas sem resposta?
                        </label>
                        <input type="number" min={1} max={720}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                            value={restartHours}
                            onChange={(e) => setRestartHours(Number(e.target.value))} />
                        <p className="text-[10px] text-gray-400 mt-1">
                            Ex: 24h = cliente que sumiu e voltou depois de 1 dia recebe o fluxo novamente.
                        </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">✅ Proteções sempre ativas:</p>
                        <ul className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 space-y-0.5">
                            <li>• Bot não responde mensagens de grupos</li>
                            <li>• Bot para quando corretor assume o atendimento</li>
                            <li>• Delay humano configurável em cada nó</li>
                        </ul>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                    <button onClick={() => onSave({ trigger_type: trigger, restart_after_hours: restartHours })}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const Automacoes = () => {
    const [fluxo, setFluxo] = useState<Fluxo | null>(null);
    const [selectedNoId, setSelectedNoId] = useState<string | null>(null);
    const [editingNo, setEditingNo] = useState<FluxoNo | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [draggingNo, setDraggingNo] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showConfig, setShowConfig] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // ─── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: inst } = await supabase
                .from("whatsapp_instancias")
                .select("instance_name")
                .eq("user_id", user.id)
                .maybeSingle();

            const instName = inst?.instance_name ?? `inst-${user.id.slice(0, 8)}`;

            const { data: flowData } = await supabase
                .from("automation_flows")
                .select("*, automation_nodes(*)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            if (flowData) {
                setFluxo({
                    id: flowData.id,
                    nome: flowData.name,
                    status: flowData.status as FluxoStatus,
                    trigger_type: (flowData.trigger_type ?? "always") as TriggerType,
                    instance_name: flowData.instance_name,
                    restart_after_hours: flowData.restart_after_hours ?? 24,
                    nos: (flowData.automation_nodes ?? [])
                        .map((n: any) => ({
                            id: n.id,
                            type: n.type as NodeType,
                            label: n.label ?? "",
                            message: n.message ?? "",
                            order_index: n.order_index ?? 0,
                            next_node_id: n.next_node_id ?? undefined,
                            delay_seconds: n.delay_seconds ?? 2,
                            x: n.x ?? 60,
                            y: n.y ?? 120,
                            options: n.node_data?.options ?? undefined,
                            variable_name: n.node_data?.variable_name ?? undefined,
                            transfer_message: n.node_data?.transfer_message ?? undefined,
                        }))
                        .sort((a: FluxoNo, b: FluxoNo) => a.order_index - b.order_index),
                });
            } else {
                const { data: newFlow, error: flowError } = await supabase
                    .from("automation_flows")
                    .insert({
                        user_id: user.id,
                        instance_name: instName,
                        name: "Meu Fluxo",
                        status: "rascunho",
                        trigger_type: "always",
                        restart_after_hours: 24,
                    })
                    .select()
                    .single();

                if (flowError || !newFlow) {
                    toast.error("Erro ao criar fluxo inicial.");
                    setLoading(false);
                    return;
                }

                const startId = uid();
                const endId = uid();

                await supabase.from("automation_nodes").insert([
                    { id: startId, flow_id: newFlow.id, type: "start", label: "Início", message: "Olá! Como posso te ajudar? 😊", order_index: 0, next_node_id: endId, delay_seconds: 2, x: 80, y: 140, node_data: {} },
                    { id: endId, flow_id: newFlow.id, type: "end", label: "Finalizar", message: "Em breve um corretor vai te atender! 🏡", order_index: 1, next_node_id: null, delay_seconds: 0, x: 500, y: 140, node_data: {} },
                ]);

                setFluxo({
                    id: newFlow.id, nome: "Meu Fluxo", status: "rascunho",
                    trigger_type: "always", instance_name: instName, restart_after_hours: 24,
                    nos: [
                        { id: startId, type: "start", label: "Início", message: "Olá! Como posso te ajudar? 😊", order_index: 0, next_node_id: endId, delay_seconds: 2, x: 80, y: 140 },
                        { id: endId, type: "end", label: "Finalizar", message: "Em breve um corretor vai te atender! 🏡", order_index: 1, delay_seconds: 0, x: 500, y: 140 },
                    ],
                });
            }

            setLoading(false);
        }
        init();
    }, []);

    // ─── Salvar com upsert ────────────────────────────────────────────────────
    async function salvarFluxo() {
        if (!fluxo) return;
        setSaving(true);
        try {
            const { error: flowError } = await supabase
                .from("automation_flows")
                .update({ trigger_type: fluxo.trigger_type, restart_after_hours: fluxo.restart_after_hours })
                .eq("id", fluxo.id);
            if (flowError) throw flowError;

            const { data: existingNodes } = await supabase
                .from("automation_nodes").select("id").eq("flow_id", fluxo.id);

            const existingIds = new Set((existingNodes ?? []).map((n: any) => n.id));
            const currentIds = new Set(fluxo.nos.map(n => n.id));
            const toDelete = [...existingIds].filter(id => !currentIds.has(id));

            if (toDelete.length > 0) {
                await supabase.from("automation_nodes").delete().in("id", toDelete);
            }

            const { error: upsertError } = await supabase
                .from("automation_nodes")
                .upsert(
                    fluxo.nos.map((n, i) => ({
                        id: n.id,
                        flow_id: fluxo.id,
                        type: n.type,
                        label: n.label,
                        message: n.message,
                        order_index: i,
                        next_node_id: n.next_node_id ?? null,
                        delay_seconds: n.delay_seconds ?? 2,
                        x: Math.round(n.x),
                        y: Math.round(n.y),
                        node_data: {
                            options: n.options ?? null,
                            variable_name: n.variable_name ?? null,
                            transfer_message: n.transfer_message ?? null,
                        },
                    })),
                    { onConflict: "id" }
                );

            if (upsertError) throw upsertError;
            toast.success("Fluxo salvo!");
        } catch (err: any) {
            console.error("Erro ao salvar:", err);
            toast.error(`Erro ao salvar: ${err.message}`);
        }
        setSaving(false);
    }

    // ─── Ativar / Pausar ──────────────────────────────────────────────────────
    async function toggleStatus() {
        if (!fluxo) return;
        const next: FluxoStatus = fluxo.status === "ativo" ? "rascunho" : "ativo";
        const { error } = await supabase.from("automation_flows").update({ status: next }).eq("id", fluxo.id);
        if (error) { toast.error("Erro ao alterar status."); return; }
        setFluxo({ ...fluxo, status: next });
        toast.success(next === "ativo" ? "✅ Bot ativado!" : "⏸ Bot pausado.");
    }

    // ─── Nós ──────────────────────────────────────────────────────────────────
    function adicionarNo(type: NodeType) {
        if (!fluxo) return;
        const novo: FluxoNo = {
            id: uid(), type, label: NODE_CONFIG[type].label, message: "",
            order_index: fluxo.nos.length, delay_seconds: 2,
            x: 200 + Math.random() * 100, y: 80 + Math.random() * 200,
            options: type === "menu" ? [] : undefined,
        };
        setFluxo({ ...fluxo, nos: [...fluxo.nos, novo] });
        setShowAddMenu(false);
    }

    function salvarNo(updated: FluxoNo) {
        if (!fluxo) return;
        setFluxo({ ...fluxo, nos: fluxo.nos.map(n => n.id === updated.id ? updated : n) });
        setEditingNo(null);
    }

    function deletarNo(id: string) {
        if (!fluxo) return;
        const nos = fluxo.nos
            .filter(n => n.id !== id)
            .map(n => ({
                ...n,
                next_node_id: n.next_node_id === id ? undefined : n.next_node_id,
                options: n.options?.map(o => ({ ...o, next_node_id: o.next_node_id === id ? undefined : o.next_node_id })),
            }));
        setFluxo({ ...fluxo, nos });
        setSelectedNoId(null);
    }

    function handleConnect(toId: string) {
        if (!connectingFrom) { setConnectingFrom(toId); toast.info("Clique no nó destino para conectar."); return; }
        if (connectingFrom === toId) { setConnectingFrom(null); return; }
        const nos = fluxo!.nos.map(n => n.id === connectingFrom ? { ...n, next_node_id: toId } : n);
        setFluxo({ ...fluxo!, nos });
        setConnectingFrom(null);
        toast.success("Nós conectados!");
    }

    // ─── Drag ─────────────────────────────────────────────────────────────────
    function startDrag(e: React.MouseEvent, id: string) {
        e.preventDefault();
        const no = fluxo?.nos.find(n => n.id === id);
        if (!no) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDraggingNo(id);
        setDragOffset({ x: e.clientX - rect.left - no.x, y: e.clientY - rect.top - no.y });
    }

    function onDrag(e: React.MouseEvent) {
        if (!draggingNo || !fluxo) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
        const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
        setFluxo({ ...fluxo, nos: fluxo.nos.map(n => n.id === draggingNo ? { ...n, x, y } : n) });
    }

    // ─── Conexões SVG ─────────────────────────────────────────────────────────
    function renderConexoes() {
        if (!fluxo) return null;
        const lines: JSX.Element[] = [];

        fluxo.nos.forEach(no => {
            // Conexão normal (next_node_id)
            if (no.next_node_id && no.type !== "menu") {
                const dest = fluxo.nos.find(n => n.id === no.next_node_id);
                if (dest) {
                    const x1 = no.x + 240 + 12, y1 = no.y + 55;
                    const x2 = dest.x - 12, y2 = dest.y + 55;
                    const mx = (x1 + x2) / 2;
                    lines.push(
                        <path key={`${no.id}-next`}
                            d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                            fill="none" stroke="#93c5fd" strokeWidth="2"
                            strokeDasharray="5 3" markerEnd="url(#arrow)" />
                    );
                }
            }

            // Conexões das opções do menu
            if (no.type === "menu" && no.options) {
                no.options.forEach((opt, idx) => {
                    if (!opt.next_node_id) return;
                    const dest = fluxo.nos.find(n => n.id === opt.next_node_id);
                    if (!dest) return;
                    const x1 = no.x + 240 + 12;
                    const y1 = no.y + 60 + idx * 16;
                    const x2 = dest.x - 12, y2 = dest.y + 55;
                    const mx = (x1 + x2) / 2;
                    lines.push(
                        <path key={`${no.id}-opt-${idx}`}
                            d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                            fill="none" stroke="#c4b5fd" strokeWidth="1.5"
                            strokeDasharray="4 3" markerEnd="url(#arrow-purple)" />
                    );
                });
            }
        });

        return lines;
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#f5f6fa] dark:bg-[#0f1117]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="h-screen flex bg-[#f5f6fa] dark:bg-[#0f1117] overflow-hidden">
            <Sidebar />

            {editingNo && (
                <NoEditModal
                    no={editingNo}
                    allNodes={fluxo?.nos ?? []}
                    onSave={salvarNo}
                    onClose={() => setEditingNo(null)}
                />
            )}

            {showConfig && fluxo && (
                <ConfigModal
                    fluxo={fluxo}
                    onSave={(u) => { setFluxo({ ...fluxo, ...u }); setShowConfig(false); toast.success("Configurações salvas!"); }}
                    onClose={() => setShowConfig(false)}
                />
            )}

            <div className="ml-16 flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-14 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-5 gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Automação WhatsApp</p>
                        <p className="text-xs text-gray-400">
                            {fluxo ? `${fluxo.nos.length} nós · ${TRIGGER_LABELS[fluxo.trigger_type]}` : "Carregando..."}
                        </p>
                    </div>

                    {fluxo && (
                        <>
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium
                                ${fluxo.status === "ativo" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                {fluxo.status === "ativo" ? "● Bot ativo" : "● Rascunho"}
                            </span>

                            <button onClick={() => setShowConfig(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100">
                                <Settings className="w-3.5 h-3.5" /> Configurar
                            </button>

                            {/* Dropdown de adicionar nó */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAddMenu(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border bg-blue-50 border-blue-300 text-blue-600 hover:opacity-80">
                                    <Plus className="w-3.5 h-3.5" /> Adicionar <ChevronDown className="w-3 h-3" />
                                </button>
                                {showAddMenu && (
                                    <div className="absolute right-0 top-9 z-50 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-2xl shadow-xl overflow-hidden w-44">
                                        {ADDABLE_NODES.map(type => {
                                            const cfg = NODE_CONFIG[type];
                                            const Icon = cfg.Icon;
                                            return (
                                                <button key={type} onClick={() => adicionarNo(type)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors">
                                                    <Icon className={`w-4 h-4 ${cfg.icon}`} />
                                                    {cfg.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {connectingFrom && (
                                <span className="text-xs text-purple-500 bg-purple-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                    <ArrowRight className="w-3 h-3" /> Clique no destino
                                    <button onClick={() => setConnectingFrom(null)}><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            <button onClick={toggleStatus}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors
                                    ${fluxo.status === "ativo" ? "text-white bg-amber-500 hover:bg-amber-600" : "text-white bg-emerald-600 hover:bg-emerald-700"}`}>
                                {fluxo.status === "ativo" ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Ativar</>}
                            </button>

                            <button onClick={salvarFluxo} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar
                            </button>
                        </>
                    )}
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="flex-1 relative overflow-auto bg-[#f8f9fc] dark:bg-[#0d1017]"
                    style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                    onMouseMove={onDrag}
                    onMouseUp={() => setDraggingNo(null)}
                    onMouseLeave={() => setDraggingNo(null)}
                    onClick={() => {
                        setSelectedNoId(null);
                        if (connectingFrom) setConnectingFrom(null);
                        if (showAddMenu) setShowAddMenu(false);
                    }}
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1000, minHeight: 600 }}>
                        <defs>
                            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L9,3 z" fill="#93c5fd" />
                            </marker>
                            <marker id="arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L9,3 z" fill="#c4b5fd" />
                            </marker>
                        </defs>
                        {renderConexoes()}
                    </svg>

                    {fluxo?.nos.map(no => (
                        <div key={no.id} onMouseDown={(e) => startDrag(e, no.id)}
                            style={{ cursor: draggingNo === no.id ? "grabbing" : "grab" }}>
                            <NoCard
                                no={no}
                                selected={selectedNoId === no.id}
                                onSelect={() => {
                                    setSelectedNoId(no.id);
                                    if (connectingFrom && connectingFrom !== no.id) handleConnect(no.id);
                                }}
                                onEdit={() => setEditingNo(no)}
                                onDelete={() => deletarNo(no.id)}
                                onConnect={() => handleConnect(no.id)}
                                connecting={connectingFrom === no.id}
                            />
                        </div>
                    ))}

                    {fluxo && fluxo.status !== "ativo" && (
                        <div className="absolute bottom-6 right-6 bg-white dark:bg-[#1a1d27] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2f45] px-4 py-3 max-w-xs">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">💡 Tipos de nós disponíveis:</p>
                            <ul className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                <li>💬 <strong>Mensagem</strong> — envia texto simples</li>
                                <li>🟣 <strong>Menu</strong> — mostra opções numeradas</li>
                                <li>🔵 <strong>Pergunta</strong> — coleta resposta do cliente</li>
                                <li>🟠 <strong>Transferir</strong> — chama o corretor</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Automacoes;