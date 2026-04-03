import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { updateLead } from "@/integrations/supabase/leads/updateLead";
import { deleteLead } from "@/integrations/supabase/leads/deleteLead";
import {
    Users,
    UserCheck,
    TrendingUp,
    BarChart2,
    Search,
    SlidersHorizontal,
    Phone,
    Mail,
    Calendar,
    Star,
    MoreVertical,
    Archive,
    Trash2,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
} from "recharts";

const ETAPAS = [
    { id: "novo", title: "Novo Cliente", dot: "bg-purple-500" },
    { id: "contato", title: "Em contato", dot: "bg-yellow-500" },
    { id: "Visista", title: "Visita Marcada", dot: "bg-orange-500" },
    { id: "Proposta", title: "Proposta Enviada", dot: "bg-green-600" },
    { id: "desistiu", title: "Cliente desistiu", dot: "bg-red-500" },
];

type Tab = "kanban" | "bolsao" | "estatisticas";

function getInitials(nome: string) {
    return nome
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

function getAvatarColor(nome: string) {
    const colors = [
        "bg-purple-600",
        "bg-blue-600",
        "bg-pink-600",
        "bg-orange-500",
        "bg-teal-600",
        "bg-indigo-600",
    ];
    return colors[nome.charCodeAt(0) % colors.length];
}

function LeadCard({
    lead,
    onDragStart,
    onMoverBolsao,
    onExcluir,
}: {
    lead: any;
    onDragStart: () => void;
    onMoverBolsao: (id: string) => void;
    onExcluir: (lead: any) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className={clsx(
                "rounded-xl p-3 cursor-move shadow-sm hover:shadow-md transition-all border",
                lead._animate && "animate-fireworks",
                lead.status === "desistiu"
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-100"
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={clsx(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                        getAvatarColor(lead.nome || "A")
                    )}
                >
                    {getInitials(lead.nome || "?")}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{lead.nome}</p>
                    {lead.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                        </div>
                    )}
                    {lead.telefone && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-500">{lead.telefone}</p>
                        </div>
                    )}
                    {lead.created_at && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-400">
                                Captado em: {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    )}
                </div>

                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMoverBolsao(lead.id); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Archive className="w-4 h-4 text-gray-400" />
                                Mover para Bolsão
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onExcluir(lead); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir lead
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                {lead.corretor && (
                    <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">
                        {lead.corretor}
                    </span>
                )}
                {lead.score !== undefined && (
                    <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-600 font-medium">{lead.score}/100</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PipelineLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hoverCol, setHoverCol] = useState<string | null>(null);
    const [openConfirmVenda, setOpenConfirmVenda] = useState(false);
    const [leadParaVenda, setLeadParaVenda] = useState<any>(null);
    const [openConfirmExcluir, setOpenConfirmExcluir] = useState(false);
    const [leadParaExcluir, setLeadParaExcluir] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<Tab>("kanban");
    const [periodoEstat, setPeriodoEstat] = useState<number | null>(null);

    const navigate = useNavigate();

    async function carregar() {
        const data = await getLeads();
        setLeads(data || []);
    }

    useEffect(() => {
        carregar();
    }, []);

    async function onDrop(etapaId: string) {
        if (!draggingId) return;
        const lead = leads.find((l) => l.id === draggingId);
        await updateLead(draggingId, { status: etapaId });
        setLeads((prev) =>
            prev.map((l) =>
                l.id === draggingId ? { ...l, status: etapaId, _animate: true } : l
            )
        );
        setDraggingId(null);
        setHoverCol(null);
        if (etapaId === "Proposta" && lead) {
            setLeadParaVenda(lead);
            setOpenConfirmVenda(true);
        }
        setTimeout(() => {
            setLeads((prev) => prev.map((l) => ({ ...l, _animate: false })));
        }, 300);
    }

    async function moverParaBolsao(id: string) {
        await updateLead(id, { status: "bolsao" });
        setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: "bolsao" } : l));
    }

    function confirmarExcluir(lead: any) {
        setLeadParaExcluir(lead);
        setOpenConfirmExcluir(true);
    }

    async function excluirLead() {
        if (!leadParaExcluir) return;
        await deleteLead(leadParaExcluir.id);
        setLeads((prev) => prev.filter((l) => l.id !== leadParaExcluir.id));
        setOpenConfirmExcluir(false);
        setLeadParaExcluir(null);
    }

    const totalLeads = leads.filter((l) => l.status !== "bolsao").length;
    const leadsAtivos = leads.filter((l) => l.status !== "desistiu" && l.status !== "bolsao").length;
    const visitasMarcadas = leads.filter((l) => l.status === "Visista").length;
    const taxaConversao =
        totalLeads > 0 ? ((visitasMarcadas / totalLeads) * 100).toFixed(1) : "0.0";

    const leadsKanban = leads.filter((l) => l.status !== "bolsao");
    const leadsBolsao = leads.filter((l) => l.status === "bolsao");

    const leadsEstat = periodoEstat === null
        ? leadsKanban
        : leadsKanban.filter((l) => {
            if (!l.criado_em) return true;
            const diff = (Date.now() - new Date(l.criado_em).getTime()) / (1000 * 60 * 60 * 24);
            return diff <= periodoEstat;
        });

    const filteredLeads = leadsKanban.filter((l) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            l.nome?.toLowerCase().includes(q) ||
            l.telefone?.includes(q) ||
            l.email?.toLowerCase().includes(q)
        );
    });

    const funnelData = ETAPAS.map((e) => ({
        name: e.title,
        quantidade: leadsEstat.filter((l) => l.status === e.id).length,
    }));

    const interesseMap: Record<string, number> = {};
    leadsEstat.forEach((l) => {
        const k = l.interesse || "Sem origem";
        interesseMap[k] = (interesseMap[k] || 0) + 1;
    });
    const origemData = Object.entries(interesseMap).map(([name, value]) => ({ name, value }));

    const timelineMap: Record<string, number> = {};
    leadsEstat.forEach((l) => {
        if (!l.criado_em) return;
        const d = new Date(l.criado_em);
        const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
        timelineMap[key] = (timelineMap[key] || 0) + 1;
    });
    const timelineData = Object.entries(timelineMap)
        .sort((a, b) => {
            const parse = (s: string) => {
                const [dd, mm, yy] = s.split("/");
                return new Date(`20${yy}-${mm}-${dd}`).getTime();
            };
            return parse(a[0]) - parse(b[0]);
        })
        .map(([data, leads]) => ({ data, leads }));

    const TABS: { id: Tab; label: string }[] = [
        { id: "kanban", label: "Funil Kanban" },
        { id: "bolsao", label: "Bolsão" },
        { id: "estatisticas", label: "Estatísticas" },
    ];

    const INTEREST_COLORS = ["#7c3aed", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <main className="ml-16 p-6 h-screen overflow-hidden flex flex-col">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                </div>

                <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1 mb-5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "px-5 py-2 text-base font-medium rounded-md transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-4 mb-5">
                    {[
                        { icon: <Users className="w-5 h-5 text-purple-600" />, label: "TOTAL DE LEADS", value: totalLeads },
                        { icon: <UserCheck className="w-5 h-5 text-purple-600" />, label: "LEADS ATIVOS", value: leadsAtivos },
                        { icon: <TrendingUp className="w-5 h-5 text-purple-600" />, label: "VISITAS MARCADAS", value: visitasMarcadas },
                        { icon: <BarChart2 className="w-5 h-5 text-purple-600" />, label: "TAXA DE CONVERSÃO", value: `${taxaConversao}%` },
                    ].map((m, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                    {m.icon}
                                </div>
                                <span className="text-xs text-green-500 font-medium">↑ +0%</span>
                            </div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                        </div>
                    ))}
                </div>

                {activeTab === "kanban" && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por nome, corretor, telefone, email..."
                                    className="pl-9 bg-white border-gray-200 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                        </div>

                        <div
                            className="grid gap-4 flex-1 overflow-y-auto pb-4"
                            style={{ gridTemplateColumns: `repeat(${ETAPAS.length}, minmax(0, 1fr))` }}
                        >
                            {ETAPAS.map((etapa) => {
                                const leadsDaEtapa = filteredLeads.filter((l) => l.status === etapa.id);

                                return (
                                    <div
                                        key={etapa.id}
                                        className={clsx(
                                            "flex flex-col rounded-xl bg-white border border-gray-100 shadow-sm transition min-h-[200px]",
                                            hoverCol === etapa.id && "ring-2 ring-purple-300"
                                        )}
                                        onDragOver={(e) => { e.preventDefault(); setHoverCol(etapa.id); }}
                                        onDragLeave={() => setHoverCol(null)}
                                        onDrop={() => onDrop(etapa.id)}
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className={clsx("w-2.5 h-2.5 rounded-full", etapa.dot)} />
                                                <span className="font-semibold text-sm text-gray-700">{etapa.title}</span>
                                            </div>
                                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                                                {leadsDaEtapa.length}
                                            </span>
                                        </div>

                                        <div className="p-3 space-y-3 overflow-y-auto flex-1">
                                            {leadsDaEtapa.length === 0 ? (
                                                <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center text-xs text-gray-400">
                                                    Arraste leads para cá
                                                </div>
                                            ) : (
                                                leadsDaEtapa.map((lead) => (
                                                    <LeadCard
                                                        key={lead.id}
                                                        lead={lead}
                                                        onDragStart={() => setDraggingId(lead.id)}
                                                        onMoverBolsao={moverParaBolsao}
                                                        onExcluir={confirmarExcluir}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === "bolsao" && (
                    <div className="flex-1 overflow-y-auto">
                        {leadsBolsao.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-gray-400">Nenhum lead no bolsão no momento.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                {leadsBolsao.map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onDragStart={() => setDraggingId(lead.id)}
                                        onMoverBolsao={moverParaBolsao}
                                        onExcluir={confirmarExcluir}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "estatisticas" && (
                    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                        <div className="flex items-center gap-2 mb-2">
                            {[
                                { label: "7 dias", value: 7 },
                                { label: "30 dias", value: 30 },
                                { label: "3 meses", value: 90 },
                                { label: "6 meses", value: 180 },
                                { label: "1 ano", value: 365 },
                                { label: "Todos", value: null },
                            ].map((op) => (
                                <button
                                    key={String(op.value)}
                                    onClick={() => setPeriodoEstat(op.value)}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                                        periodoEstat === op.value
                                            ? "bg-purple-600 text-white border-purple-600"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-600"
                                    )}
                                >
                                    {op.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                <span className="font-medium">Taxa de Conversão Geral</span>
                            </div>
                            <p className="text-4xl font-bold text-purple-600">{taxaConversao}%</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {visitasMarcadas} Visitas Marcadas de {leadsAtivos} Leads Ativos
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                                <h3 className="font-semibold text-gray-800 mb-1">Funil de Conversão</h3>
                                <p className="text-xs text-gray-400 mb-4">Quantidade de leads por estágio</p>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                                        <Tooltip />
                                        <Bar dataKey="quantidade" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                                <h3 className="font-semibold text-gray-800 mb-1">Leads por Interesse</h3>
                                <p className="text-xs text-gray-400 mb-4">Distribuição de leads por interesse</p>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={origemData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                                            {origemData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={INTEREST_COLORS[index % INTEREST_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            iconType="square"
                                            iconSize={10}
                                            formatter={(value, entry: any) =>
                                                `${value} (${((entry.payload.value / (totalLeads || 1)) * 100).toFixed(0)}%)`
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <h3 className="font-semibold text-gray-800 mb-1">Timeline de Captação</h3>
                            <p className="text-xs text-gray-400 mb-4">Leads captados ao longo do tempo</p>
                            {timelineData.length === 0 ? (
                                <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
                                    Nenhum dado de captação disponível
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={timelineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(value: any) => [`${value} lead(s)`, "Captados"]} />
                                        <Line type="monotone" dataKey="leads" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Dialog open={openConfirmVenda} onOpenChange={setOpenConfirmVenda}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalizar como venda?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Deseja transformar o lead <strong>{leadParaVenda?.nome}</strong> em uma venda?
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenConfirmVenda(false)}>Não</Button>
                        <Button
                            onClick={() => {
                                setOpenConfirmVenda(false);
                                navigate("/dashboard/vendas", { state: { leadId: leadParaVenda.id } });
                            }}
                        >
                            Sim, criar venda
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openConfirmExcluir} onOpenChange={setOpenConfirmExcluir}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir lead?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Tem certeza que deseja excluir o lead <strong>{leadParaExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenConfirmExcluir(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={excluirLead}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}