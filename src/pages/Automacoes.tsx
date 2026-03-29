import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Plus, Play, Pause, Trash2, Save, X, ChevronDown,
    Zap, MessageSquare, Clock, CheckCircle, Settings,
    ArrowRight, MoreVertical, Edit2, Copy, AlertCircle,
    Users, Tag, PhoneCall, RotateCcw, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/evolution-proxy`;

// ─── Tipos ────────────────────────────────────────────────────────────────────
type NodeType = "iniciar" | "acao" | "aguardar" | "finalizar";
type AcaoTipo = "atendimento" | "etiqueta" | "fila" | "mensagem";
type FluxoStatus = "ativo" | "pausado" | "rascunho";

interface FluxoNo {
    id: string;
    tipo: NodeType;
    titulo: string;
    conteudo: string;
    acaoTipo?: AcaoTipo;
    etiquetas?: string[];
    aguardarMinutos?: number;
    proximoId?: string;
    x: number;
    y: number;
}

interface Fluxo {
    id: string;
    nome: string;
    descricao: string;
    status: FluxoStatus;
    nos: FluxoNo[];
    criadoEm: string;
    execucoes: number;
    instanceName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NODE_COLORS: Record<NodeType, { bg: string; border: string; icon: string; label: string }> = {
    iniciar: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-400", icon: "text-amber-500", label: "Iniciar" },
    acao: { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-400", icon: "text-orange-500", label: "Ação" },
    aguardar: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-400", icon: "text-blue-500", label: "Aguardar" },
    finalizar: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-400", icon: "text-red-500", label: "Finalizar" },
};

const NODE_ICONS: Record<NodeType, React.FC<any>> = {
    iniciar: Zap,
    acao: Settings,
    aguardar: Clock,
    finalizar: CheckCircle,
};

function uid() { return Math.random().toString(36).slice(2, 10); }

const FLUXO_VAZIO: Omit<Fluxo, "id" | "criadoEm"> = {
    nome: "Novo Fluxo",
    descricao: "",
    status: "rascunho",
    nos: [
        { id: "no-start", tipo: "iniciar", titulo: "Início", conteudo: "Olá! Como posso te ajudar?", x: 60, y: 120 },
        { id: "no-end", tipo: "finalizar", titulo: "Finalizar", conteudo: "Atendimento encerrado.", x: 500, y: 120 },
    ],
    execucoes: 0,
};

// ─── Componente do Nó ────────────────────────────────────────────────────────
const FluxoNoCard = ({
    no, selected, onSelect, onEdit, onDelete, onConnect, connecting,
}: {
    no: FluxoNo;
    selected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onConnect: () => void;
    connecting: boolean;
}) => {
    const cfg = NODE_COLORS[no.tipo];
    const Icon = NODE_ICONS[no.tipo];

    return (
        <div
            className={`absolute cursor-pointer select-none transition-all duration-150
        ${cfg.bg} border-2 ${cfg.border} rounded-2xl shadow-sm w-52
        ${selected ? "ring-2 ring-offset-2 ring-blue-500 shadow-md" : "hover:shadow-md"}
        ${connecting ? "ring-2 ring-purple-400" : ""}
      `}
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
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="w-6 h-6 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                    {no.tipo !== "iniciar" && no.tipo !== "finalizar" && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="w-6 h-6 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-3 py-2.5">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 mb-1">{no.titulo}</p>
                {no.conteudo && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{no.conteudo}</p>
                )}
                {no.etiquetas && no.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {no.etiquetas.map((et) => (
                            <span key={et} className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium">
                                {et}
                            </span>
                        ))}
                    </div>
                )}
                {no.aguardarMinutos && (
                    <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-1">⏱ {no.aguardarMinutos} min</p>
                )}
            </div>

            {/* Conector saída */}
            {no.tipo !== "finalizar" && (
                <button
                    onClick={(e) => { e.stopPropagation(); onConnect(); }}
                    className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
            ${no.proximoId ? "bg-blue-500 border-blue-500 text-white" : "bg-white dark:bg-[#1a1d27] border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400"}
          `}
                    title="Conectar ao próximo nó"
                >
                    <ArrowRight className="w-3 h-3" />
                </button>
            )}

            {/* Conector entrada */}
            {no.tipo !== "iniciar" && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#1a1d27] border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
            )}
        </div>
    );
};

// ─── Modal de edição do nó ───────────────────────────────────────────────────
const NoEditModal = ({ no, onSave, onClose }: {
    no: FluxoNo;
    onSave: (updated: FluxoNo) => void;
    onClose: () => void;
}) => {
    const [form, setForm] = useState<FluxoNo>({ ...no });
    const [etiquetaInput, setEtiquetaInput] = useState("");

    function addEtiqueta() {
        if (!etiquetaInput.trim()) return;
        setForm((f) => ({ ...f, etiquetas: [...(f.etiquetas ?? []), etiquetaInput.trim()] }));
        setEtiquetaInput("");
    }

    function removeEtiqueta(et: string) {
        setForm((f) => ({ ...f, etiquetas: (f.etiquetas ?? []).filter((e) => e !== et) }));
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Editar nó</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Título */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Título</label>
                        <input
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                            value={form.titulo}
                            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                        />
                    </div>

                    {/* Conteúdo / Mensagem */}
                    {(form.tipo === "iniciar" || form.tipo === "finalizar" || form.tipo === "aguardar") && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Mensagem</label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 resize-none"
                                value={form.conteudo}
                                onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                            />
                        </div>
                    )}

                    {/* Tipo de ação */}
                    {form.tipo === "acao" && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Tipo de ação</label>
                                <select
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                    value={form.acaoTipo ?? "mensagem"}
                                    onChange={(e) => setForm((f) => ({ ...f, acaoTipo: e.target.value as AcaoTipo }))}
                                >
                                    <option value="mensagem">Enviar mensagem</option>
                                    <option value="atendimento">Transferir para atendimento</option>
                                    <option value="etiqueta">Adicionar etiqueta</option>
                                    <option value="fila">Adicionar à fila</option>
                                </select>
                            </div>

                            {form.acaoTipo === "mensagem" && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Mensagem</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 resize-none"
                                        value={form.conteudo}
                                        onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                                    />
                                </div>
                            )}

                            {form.acaoTipo === "etiqueta" && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Etiquetas</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                            placeholder="Nome da etiqueta..."
                                            value={etiquetaInput}
                                            onChange={(e) => setEtiquetaInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addEtiqueta()}
                                        />
                                        <button onClick={addEtiqueta} className="px-3 py-2 bg-orange-500 text-white text-xs rounded-xl hover:bg-orange-600 transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {(form.etiquetas ?? []).map((et) => (
                                            <span key={et} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                                {et}
                                                <button onClick={() => removeEtiqueta(et)}><X className="w-3 h-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(form.acaoTipo === "atendimento" || form.acaoTipo === "fila") && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                                        {form.acaoTipo === "fila" ? "Nome da fila" : "Setor de atendimento"}
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                        value={form.conteudo}
                                        onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                                        placeholder={form.acaoTipo === "fila" ? "ex: Suporte" : "ex: Vendas"}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Aguardar tempo */}
                    {form.tipo === "aguardar" && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Aguardar (minutos)</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                value={form.aguardarMinutos ?? 60}
                                onChange={(e) => setForm((f) => ({ ...f, aguardarMinutos: Number(e.target.value) }))}
                            />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const Automacoes = () => {
    const [fluxos, setFluxos] = useState<Fluxo[]>([]);
    const [selectedFluxo, setSelectedFluxo] = useState<Fluxo | null>(null);
    const [selectedNoId, setSelectedNoId] = useState<string | null>(null);
    const [editingNo, setEditingNo] = useState<FluxoNo | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [draggingNo, setDraggingNo] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [showNewFluxo, setShowNewFluxo] = useState(false);
    const [newNome, setNewNome] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const canvasRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            // Instância WhatsApp
            const { data: inst } = await supabase.from("whatsapp_instancias").select("instance_name").eq("user_id", user.id).single();
            if (inst) setInstanceName(inst.instance_name);
            // Carrega fluxos do localStorage
            const saved = localStorage.getItem(`fluxos_${user.id}`);
            if (saved) setFluxos(JSON.parse(saved));
        }
        init();
    }, []);

    function persistFluxos(list: Fluxo[]) {
        setFluxos(list);
        if (userId) localStorage.setItem(`fluxos_${userId}`, JSON.stringify(list));
    }


    function criarFluxo() {
        const novo: Fluxo = {
            ...FLUXO_VAZIO,
            id: uid(),
            nome: newNome.trim() || "Novo Fluxo",
            descricao: newDesc.trim(),
            criadoEm: new Date().toISOString(),
            nos: FLUXO_VAZIO.nos.map((n) => ({ ...n, id: uid() })),
        };
        persistFluxos([...fluxos, novo]);
        setSelectedFluxo(novo);
        setShowNewFluxo(false);
        setNewNome(""); setNewDesc("");
        toast.success("Fluxo criado!");
    }

    function deletarFluxo(id: string) {
        const next = fluxos.filter((f) => f.id !== id);
        persistFluxos(next);
        if (selectedFluxo?.id === id) setSelectedFluxo(null);
        toast.success("Fluxo removido.");
    }


    function salvarFluxo() {
        if (!selectedFluxo) return;
        setSaving(true);
        const next = fluxos.map((f) => f.id === selectedFluxo.id ? selectedFluxo : f);
        persistFluxos(next);
        setTimeout(() => { setSaving(false); toast.success("Fluxo salvo!"); }, 500);
    }


    function toggleStatus(fluxo: Fluxo) {
        const nextStatus: FluxoStatus = fluxo.status === "ativo" ? "pausado" : "ativo";
        const updated = { ...fluxo, status: nextStatus };
        const next = fluxos.map((f) => f.id === fluxo.id ? updated : f);
        persistFluxos(next);
        if (selectedFluxo?.id === fluxo.id) setSelectedFluxo(updated);
        toast.success(`Fluxo ${nextStatus === "ativo" ? "ativado" : "pausado"}!`);
    }


    function adicionarNo(tipo: NodeType) {
        if (!selectedFluxo) return;
        const novo: FluxoNo = {
            id: uid(), tipo,
            titulo: NODE_COLORS[tipo].label,
            conteudo: "",
            acaoTipo: tipo === "acao" ? "mensagem" : undefined,
            x: 200 + Math.random() * 150,
            y: 100 + Math.random() * 200,
        };
        const updated = { ...selectedFluxo, nos: [...selectedFluxo.nos, novo] };
        setSelectedFluxo(updated);
    }


    function salvarNo(updated: FluxoNo) {
        if (!selectedFluxo) return;
        const nos = selectedFluxo.nos.map((n) => n.id === updated.id ? updated : n);
        setSelectedFluxo({ ...selectedFluxo, nos });
        setEditingNo(null);
    }

    function deletarNo(id: string) {
        if (!selectedFluxo) return;
        const nos = selectedFluxo.nos
            .filter((n) => n.id !== id)
            .map((n) => n.proximoId === id ? { ...n, proximoId: undefined } : n);
        setSelectedFluxo({ ...selectedFluxo, nos });
        setSelectedNoId(null);
    }


    function handleConnect(fromId: string) {
        if (connectingFrom === null) {
            setConnectingFrom(fromId);
            toast.info("Clique no nó destino para conectar.");
            return;
        }
        if (connectingFrom === fromId) { setConnectingFrom(null); return; }
        const nos = selectedFluxo!.nos.map((n) =>
            n.id === connectingFrom ? { ...n, proximoId: fromId } : n
        );
        setSelectedFluxo({ ...selectedFluxo!, nos });
        setConnectingFrom(null);
        toast.success("Nós conectados!");
    }


    function startDrag(e: React.MouseEvent, id: string) {
        e.preventDefault();
        const no = selectedFluxo?.nos.find((n) => n.id === id);
        if (!no) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDraggingNo(id);
        setDragOffset({ x: e.clientX - rect.left - no.x, y: e.clientY - rect.top - no.y });
    }

    function onDrag(e: React.MouseEvent) {
        if (!draggingNo || !selectedFluxo) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
        const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
        const nos = selectedFluxo.nos.map((n) => n.id === draggingNo ? { ...n, x, y } : n);
        setSelectedFluxo({ ...selectedFluxo, nos });
    }

    function stopDrag() { setDraggingNo(null); }


    async function executarFluxo(fluxo: Fluxo, numero: string) {
        if (!instanceName || !numero) return;
        setExecuting(fluxo.id);
        try {
            const nos = fluxo.nos;
            const inicio = nos.find((n) => n.tipo === "iniciar");
            if (!inicio) throw new Error("Nenhum nó de início encontrado.");

            let atual: FluxoNo | undefined = inicio;
            const phone = numero.replace(/\D/g, "");

            while (atual) {
                if (atual.tipo === "iniciar" || (atual.tipo === "acao" && atual.acaoTipo === "mensagem")) {
                    if (atual.conteudo) {
                        await fetch(`${PROXY_URL}?path=${encodeURIComponent(`/message/sendText/${instanceName}`)}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ number: phone, text: atual.conteudo }),
                        });
                        await new Promise((r) => setTimeout(r, 800));
                    }
                }
                if (atual.tipo === "aguardar" && atual.aguardarMinutos) {
                    // Em produção agendaria — aqui apenas loga
                    console.log(`[Fluxo] Aguardando ${atual.aguardarMinutos} min antes do próximo passo.`);
                }
                if (atual.tipo === "finalizar") break;
                atual = nos.find((n) => n.id === atual?.proximoId);
            }


            const updated = { ...fluxo, execucoes: fluxo.execucoes + 1 };
            persistFluxos(fluxos.map((f) => f.id === fluxo.id ? updated : f));
            if (selectedFluxo?.id === fluxo.id) setSelectedFluxo(updated);
            toast.success("Fluxo executado com sucesso!");
        } catch (err: any) {
            toast.error(`Erro ao executar: ${err.message}`);
        }
        setExecuting(null);
    }


    function renderConexoes() {
        if (!selectedFluxo) return null;
        return selectedFluxo.nos.map((no) => {
            if (!no.proximoId) return null;
            const destino = selectedFluxo.nos.find((n) => n.id === no.proximoId);
            if (!destino) return null;
            const x1 = no.x + 208 + 12;
            const y1 = no.y + 55;
            const x2 = destino.x - 12;
            const y2 = destino.y + 55;
            const mx = (x1 + x2) / 2;
            return (
                <path
                    key={`${no.id}-${no.proximoId}`}
                    d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    markerEnd="url(#arrow)"
                />
            );
        });
    }


    const [execModal, setExecModal] = useState<Fluxo | null>(null);
    const [execNumero, setExecNumero] = useState("");

    return (
        <div className="h-screen flex bg-[#f5f6fa] dark:bg-[#0f1117] overflow-hidden">
            <Sidebar />


            {showNewFluxo && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Novo fluxo</h3>
                            <button onClick={() => setShowNewFluxo(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Nome</label>
                                <input
                                    autoFocus
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                    placeholder="Ex: Follow-up leads"
                                    value={newNome}
                                    onChange={(e) => setNewNome(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && criarFluxo()}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Descrição (opcional)</label>
                                <input
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                    placeholder="Para que serve esse fluxo..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex justify-end gap-2">
                            <button onClick={() => setShowNewFluxo(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">Cancelar</button>
                            <button onClick={criarFluxo} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Criar</button>
                        </div>
                    </div>
                </div>
            )}


            {execModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Executar fluxo</h3>
                            <button onClick={() => setExecModal(null)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Digite o número que receberá o fluxo <strong className="text-gray-700 dark:text-gray-200">{execModal.nome}</strong>.</p>
                            <input
                                autoFocus
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                                placeholder="5562999999999"
                                value={execNumero}
                                onChange={(e) => setExecNumero(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && executarFluxo(execModal, execNumero)}
                            />
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">Formato: código do país + DDD + número, sem espaços.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex justify-end gap-2">
                            <button onClick={() => setExecModal(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors">Cancelar</button>
                            <button
                                onClick={() => { executarFluxo(execModal, execNumero); setExecModal(null); setExecNumero(""); }}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Play className="w-3.5 h-3.5" /> Executar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {editingNo && (
                <NoEditModal
                    no={editingNo}
                    onSave={salvarNo}
                    onClose={() => setEditingNo(null)}
                />
            )}

            <div className="ml-16 flex-1 flex overflow-hidden">


                <div className="w-72 bg-white dark:bg-[#1a1d27] border-r border-gray-200 dark:border-[#2a2f45] flex flex-col shrink-0">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-[#2a2f45]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Automações</span>
                        </div>
                        <button
                            onClick={() => setShowNewFluxo(true)}
                            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>


                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {fluxos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum fluxo ainda.<br />Clique em <strong>+</strong> para criar.</p>
                            </div>
                        )}
                        {fluxos.map((fluxo) => (
                            <div
                                key={fluxo.id}
                                onClick={() => setSelectedFluxo(fluxo)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedFluxo?.id === fluxo.id
                                        ? "bg-blue-50 dark:bg-[#1e2d4a] border-blue-300 dark:border-blue-700"
                                        : "bg-gray-50 dark:bg-[#22263a] border-gray-200 dark:border-[#2a2f45] hover:border-gray-300 dark:hover:border-gray-500"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{fluxo.nome}</p>
                                        {fluxo.descricao && (
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{fluxo.descricao}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                        ${fluxo.status === "ativo" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : ""}
                        ${fluxo.status === "pausado" ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : ""}
                        ${fluxo.status === "rascunho" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : ""}
                      `}>
                                                {fluxo.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{fluxo.nos.length} nós</span>
                                            {fluxo.execucoes > 0 && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{fluxo.execucoes}x</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(fluxo); }}
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors
                        ${fluxo.status === "ativo"
                                                    ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                            title={fluxo.status === "ativo" ? "Pausar" : "Ativar"}
                                        >
                                            {fluxo.status === "ativo" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setExecModal(fluxo); }}
                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Executar agora"
                                        >
                                            {executing === fluxo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deletarFluxo(fluxo.id); }}
                                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                                            title="Deletar"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="flex-1 flex flex-col overflow-hidden">

                    {selectedFluxo ? (
                        <>

                            <div className="h-14 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-5 gap-3 shrink-0">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedFluxo.nome}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{selectedFluxo.nos.length} nós · Clique e arraste para mover</p>
                                </div>


                                <div className="flex items-center gap-1.5">
                                    {(["acao", "aguardar"] as NodeType[]).map((tipo) => {
                                        const cfg = NODE_COLORS[tipo];
                                        const Icon = NODE_ICONS[tipo];
                                        return (
                                            <button
                                                key={tipo}
                                                onClick={() => adicionarNo(tipo)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors
                          ${cfg.bg} ${cfg.border} ${cfg.icon} hover:opacity-80`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                + {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {connectingFrom && (
                                    <span className="text-xs text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                        <ArrowRight className="w-3 h-3" /> Clique no destino
                                        <button onClick={() => setConnectingFrom(null)} className="ml-1 hover:text-purple-700"><X className="w-3 h-3" /></button>
                                    </span>
                                )}

                                <button
                                    onClick={salvarFluxo}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar
                                </button>
                            </div>


                            <div
                                ref={canvasRef}
                                className="flex-1 relative overflow-auto bg-[#f8f9fc] dark:bg-[#0d1017] cursor-default"
                                style={{
                                    backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                                    backgroundSize: "24px 24px",
                                }}
                                onMouseMove={onDrag}
                                onMouseUp={stopDrag}
                                onMouseLeave={stopDrag}
                                onClick={() => { setSelectedNoId(null); if (connectingFrom) setConnectingFrom(null); }}
                            >

                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 800, minHeight: 600 }}>
                                    <defs>
                                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                                            <path d="M0,0 L0,6 L9,3 z" fill="#93c5fd" />
                                        </marker>
                                    </defs>
                                    {renderConexoes()}
                                </svg>


                                {selectedFluxo.nos.map((no) => (
                                    <div
                                        key={no.id}
                                        onMouseDown={(e) => startDrag(e, no.id)}
                                        style={{ cursor: draggingNo === no.id ? "grabbing" : "grab" }}
                                    >
                                        <FluxoNoCard
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


                                {selectedFluxo.nos.length <= 2 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center opacity-30">
                                            <Zap className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Adicione nós e conecte-os para montar seu fluxo</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (

                        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#f8f9fc] dark:bg-[#0d1017]"
                            style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                        >
                            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-[#2a2f45] flex flex-col items-center gap-4 max-w-xs text-center">
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                    <Zap className="w-7 h-7 text-purple-500 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">Construtor de Fluxos</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Selecione um fluxo à esquerda ou crie um novo para começar.</p>
                                </div>
                                <button
                                    onClick={() => setShowNewFluxo(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Criar primeiro fluxo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Automacoes;