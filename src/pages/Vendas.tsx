import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Plus, Search, Filter, TrendingUp, Wallet,
    CheckCircle2, Clock, MoreHorizontal,
    DollarSign, FileText, Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";

import { getVendas } from "@/integrations/supabase/vendas/getVendas";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createVenda } from "@/integrations/supabase/vendas/createVenda";
import { updateVendaStatus } from "@/integrations/supabase/vendas/updateVenda";
import { deleteVenda } from "@/integrations/supabase/vendas/deleteVendas";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Venda = {
    id: string;
    valor: number;
    tipo: "Venda" | "Locação";
    status: string;
    lead_id: string | null;
    imovel_id: string | null;
    created_at?: string;
    data_venda?: string;
    base_calculo_pct?: number;
    percentual_imposto?: number;
    valor_indicacao?: number;
    premiacao_venda?: number;
    data_prev_comissao?: string;
    base_calculo_tipo?: string;
};

const emptyForm = {
    leadId: "",
    dataVenda: new Date().toISOString().split("T")[0],
    imovelId: "",
    construtora: "",
    valor: "",
    baseCalculoTipo: "Base do cálculo porcentagem",
    baseCalculoPct: "4",
    percentualImposto: "0",
    valorIndicacao: "0",
    premiacaoVenda: "",
    dataPrevComissao: "",
    tipo: "Venda",
    status: "Em negociação",
};

function getStatusStyle(status: string) {
    switch (status) {
        case "Fechada": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
        case "Em negociação": return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
        case "Proposta enviada": return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
        case "Perdida": return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
        default: return "bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
    }
}

function getStatusDot(status: string) {
    switch (status) {
        case "Fechada": return "bg-emerald-500";
        case "Em negociação": return "bg-amber-500";
        case "Proposta enviada": return "bg-blue-500";
        case "Perdida": return "bg-red-500";
        default: return "bg-gray-400";
    }
}

const inputClass =
    "bg-white dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 h-10";

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1.5">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        <h3 className="font-bold text-gray-800 dark:text-white text-base">{title}</h3>
    </div>
);

export default function Vendas() {
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [imoveis, setImoveis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [busca, setBusca] = useState("");

    const { toast } = useToast();

    // modal nova venda
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<any>(emptyForm);
    const setField = (key: string, value: any) =>
        setForm((prev: any) => ({ ...prev, [key]: value }));

    // quando seleciona imóvel, preenche construtora automaticamente
    function handleImovelSelect(id: string) {
        setField("imovelId", id);
        const imovel = imoveis.find((i) => i.id === id);
        setField("construtora", imovel?.construtora || "");
    }

    // modal editar
    const [openEdit, setOpenEdit] = useState(false);
    const [vendaEditando, setVendaEditando] = useState<Venda | null>(null);
    const [novoStatus, setNovoStatus] = useState("");

    async function loadAll() {
        setLoading(true);
        const [vendasData, leadsData, imoveisData] = await Promise.all([
            getVendas(), getLeads(), getImoveis(),
        ]);
        setVendas(vendasData || []);
        setLeads(leadsData || []);
        setImoveis(Array.isArray(imoveisData) ? imoveisData : (imoveisData as any)?.data || []);
        setLoading(false);
    }

    useEffect(() => { loadAll(); }, []);

    async function handleCreateVenda() {
        if (!form.leadId) { alert("Cliente é obrigatório"); return; }
        if (!form.imovelId) { alert("Empreendimento é obrigatório"); return; }
        if (!form.valor) { alert("Valor é obrigatório"); return; }

        await createVenda({
            lead_id: form.leadId || null,
            imovel_id: form.imovelId || null,
            valor: Number(form.valor),
            tipo: form.tipo,
            status: form.status,
            data_venda: form.dataVenda || null,
            base_calculo_tipo: form.baseCalculoTipo,
            base_calculo_pct: Number(form.baseCalculoPct),
            percentual_imposto: Number(form.percentualImposto),
            valor_indicacao: Number(form.valorIndicacao),
            premiacao_venda: form.premiacaoVenda ? Number(form.premiacaoVenda) : null,
            data_prev_comissao: form.dataPrevComissao || null,
        });

        toast({ title: "Venda cadastrada!", className: "bg-green-600 text-white" });
        setOpen(false);
        setForm(emptyForm);
        loadAll();
    }

    function getLeadNome(id: string | null) {
        if (!id) return "—";
        const lead = leads.find((l) => l.id === id);
        return lead ? lead.nome : "—";
    }

    function getImovelTitulo(id: string | null) {
        if (!id) return "—";
        const imovel = imoveis.find((i) => i.id === id);
        return imovel ? imovel.titulo : "—";
    }

    function getImovelConstrutora(id: string | null) {
        if (!id) return "—";
        const imovel = imoveis.find((i) => i.id === id);
        return imovel?.construtora || "—";
    }

    function calcReceitaImob(v: Venda) {
        const pct = v.base_calculo_pct ?? 4;
        return (Number(v.valor) || 0) * (pct / 100);
    }

    const totalVendas = vendas.length;
    const vendasFechadas = vendas.filter((v) => v.status === "Fechada");
    const vendasAbertas = vendas.filter((v) => v.status !== "Fechada" && v.status !== "Perdida");
    const vgvTotal = vendas.reduce((acc, v) => acc + (Number(v.valor) || 0), 0);
    const receitaGerada = vendasFechadas.reduce((acc, v) => acc + calcReceitaImob(v), 0);
    const receitaPendente = vendasAbertas.reduce((acc, v) => acc + calcReceitaImob(v), 0);

    const vendasFiltradas = vendas.filter((v) => {
        const statusOk = filtroStatus === "todos" || v.status === filtroStatus;
        const tipoOk = filtroTipo === "todos" || v.tipo === filtroTipo;
        const txt = busca.toLowerCase();
        const buscaOk = !txt
            || getLeadNome(v.lead_id).toLowerCase().includes(txt)
            || getImovelTitulo(v.imovel_id).toLowerCase().includes(txt);
        return statusOk && tipoOk && buscaOk;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1623]">
            <Sidebar />

            <main className="ml-16 overflow-y-auto min-h-screen">
                <div className="p-8 space-y-6">


                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Vendas e Comissões
                            </h1>
                            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
                                Gerencie todas as suas vendas e acompanhe comissões
                            </p>
                        </div>
                        <Button
                            onClick={() => setOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Nova Venda
                        </Button>
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "VGV Total", value: `R$ ${vgvTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5 text-blue-500" />, iconBg: "bg-blue-50 dark:bg-blue-500/10", large: true },
                            { label: "Total de Vendas", value: totalVendas, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
                            { label: "Receita Gerada", value: `R$ ${receitaGerada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <CheckCircle2 className="w-5 h-5 text-purple-500" />, iconBg: "bg-purple-50 dark:bg-purple-500/10", large: true },
                            { label: "Receita Pendente", value: `R$ ${receitaPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <Clock className="w-5 h-5 text-amber-500" />, iconBg: "bg-amber-50 dark:bg-amber-500/10", large: true },
                        ].map((s, i) => (
                            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#161e2e] p-5 flex items-center gap-4 shadow-sm">
                                <div className={`${s.iconBg} rounded-lg p-3 flex-shrink-0`}>{s.icon}</div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 uppercase tracking-wider font-medium">{s.label}</p>
                                    <p className={`font-bold text-gray-900 dark:text-white mt-0.5 ${s.large ? "text-lg" : "text-2xl"}`}>{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    <div className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#161e2e] shadow-sm overflow-hidden">


                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3 flex-wrap">
                            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                <SelectTrigger className="w-44 h-9 bg-gray-50 dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                    <SelectItem value="todos">Todos os status</SelectItem>
                                    <SelectItem value="Em negociação">Em negociação</SelectItem>
                                    <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                                    <SelectItem value="Fechada">Fechada</SelectItem>
                                    <SelectItem value="Perdida">Perdida</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                <SelectTrigger className="w-36 h-9 bg-gray-50 dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-sm">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="Venda">Venda</SelectItem>
                                    <SelectItem value="Locação">Locação</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    placeholder="Buscar por cliente, empreendimento..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f1623] px-4 pl-9 text-sm text-gray-900 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <Button variant="outline" className="border-gray-200 dark:border-slate-700 text-gray-500 gap-2 h-9 text-sm">
                                <Filter className="w-3.5 h-3.5" /> Filtros
                            </Button>
                        </div>


                        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            <span>Data / Cliente</span>
                            <span>Empreendimento</span>
                            <span>Construtora</span>
                            <span>VGV</span>
                            <span>Receita Imob.</span>
                            <span>Status</span>
                            <span></span>
                        </div>

                        {loading ? (
                            <div>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-100 dark:border-slate-800 animate-pulse">
                                        <div className="space-y-1.5"><div className="h-3.5 bg-gray-100 dark:bg-slate-800 rounded w-24" /><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-36" /></div>
                                        <div className="h-3.5 bg-gray-100 dark:bg-slate-800 rounded w-32 self-center" />
                                        <div className="h-3.5 bg-gray-100 dark:bg-slate-800 rounded w-20 self-center" />
                                        <div className="h-3.5 bg-gray-100 dark:bg-slate-800 rounded w-24 self-center" />
                                        <div className="h-3.5 bg-gray-100 dark:bg-slate-800 rounded w-20 self-center" />
                                        <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-full w-20 self-center" />
                                        <div className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded self-center" />
                                    </div>
                                ))}
                            </div>
                        ) : vendasFiltradas.length === 0 ? (
                            <div className="py-16 text-center">
                                <Wallet className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma venda encontrada.</p>
                                <Button onClick={() => setOpen(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                    <Plus className="w-4 h-4" /> Cadastrar primeira venda
                                </Button>
                            </div>
                        ) : (
                            vendasFiltradas.map((v) => (
                                <div key={v.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors items-center">
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">
                                            {v.data_venda
                                                ? new Date(v.data_venda).toLocaleDateString("pt-BR")
                                                : v.created_at ? new Date(v.created_at).toLocaleDateString("pt-BR") : "—"}
                                        </p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{getLeadNome(v.lead_id)}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-1">{getImovelTitulo(v.imovel_id)}</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">{getImovelConstrutora(v.imovel_id)}</p>
                                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        R$ {(Number(v.valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        R$ {calcReceitaImob(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(v.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(v.status)}`} />
                                        {v.status}
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => { setVendaEditando(v); setNovoStatus(v.status); setOpenEdit(true); }}>
                                                Editar status
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500 cursor-pointer text-sm" onClick={async () => { if (!confirm("Deseja apagar esta venda?")) return; await deleteVenda(v.id); loadAll(); }}>
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-[#161e2e] border-gray-200 dark:border-slate-700 p-0">


                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white text-xl font-bold">Nova Venda</DialogTitle>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Preencha os dados abaixo para criar uma nova venda</p>
                        </DialogHeader>
                    </div>


                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-8">


                        <section>
                            <SectionTitle icon={<FileText className="w-5 h-5" />} title="Dados da Venda" />
                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <FieldLabel required>Cliente (lead)</FieldLabel>
                                    <Select value={form.leadId} onValueChange={(v) => setField("leadId", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Buscar lead cadastrado..." /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <FieldLabel required>Data da Venda</FieldLabel>
                                    <Input
                                        type="date"
                                        value={form.dataVenda}
                                        onChange={(e) => setField("dataVenda", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <FieldLabel required>Empreendimento</FieldLabel>
                                    <Select value={form.imovelId} onValueChange={handleImovelSelect}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione o empreendimento" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {imoveis.map((i) => <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <FieldLabel>Construtora</FieldLabel>
                                    <Input
                                        placeholder="Preenchido automaticamente"
                                        value={form.construtora}
                                        readOnly
                                        className={`${inputClass} bg-gray-50 dark:bg-slate-800/50 text-gray-400 cursor-not-allowed`}
                                    />
                                </div>

                                <div>
                                    <FieldLabel required>Valor da Venda (VGV)</FieldLabel>
                                    <Input
                                        type="number"
                                        placeholder="R$ 0,00"
                                        value={form.valor}
                                        onChange={(e) => setField("valor", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <FieldLabel required>Tipo de Base do Cálculo</FieldLabel>
                                    <Select value={form.baseCalculoTipo} onValueChange={(v) => setField("baseCalculoTipo", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            <SelectItem value="Base do cálculo porcentagem">Base do cálculo porcentagem</SelectItem>
                                            <SelectItem value="Base do cálculo valor fixo">Base do cálculo valor fixo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <FieldLabel required>Base do cálculo (%)</FieldLabel>
                                    <Input
                                        type="number"
                                        placeholder="4"
                                        value={form.baseCalculoPct}
                                        onChange={(e) => setField("baseCalculoPct", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Percentual de Imposto (%)</FieldLabel>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={form.percentualImposto}
                                        onChange={(e) => setField("percentualImposto", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Valor de Indicação (R$)</FieldLabel>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={form.valorIndicacao}
                                        onChange={(e) => setField("valorIndicacao", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <FieldLabel>Premiação Venda (R$)</FieldLabel>
                                    <Input
                                        type="number"
                                        placeholder="R$ 0,00"
                                        value={form.premiacaoVenda}
                                        onChange={(e) => setField("premiacaoVenda", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <FieldLabel>Data prevista de pagamento da comissão</FieldLabel>
                                    <Input
                                        type="date"
                                        placeholder="Opcional"
                                        value={form.dataPrevComissao}
                                        onChange={(e) => setField("dataPrevComissao", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <FieldLabel required>Status</FieldLabel>
                                    <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            <SelectItem value="Em negociação">Em negociação</SelectItem>
                                            <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                                            <SelectItem value="Fechada">Fechada</SelectItem>
                                            <SelectItem value="Perdida">Perdida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>
                    </div>


                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-3 flex-shrink-0 bg-white dark:bg-[#161e2e]">
                        <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300">
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateVenda} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
                            Criar Venda
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="max-w-sm bg-white dark:bg-[#161e2e] border-gray-200 dark:border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white font-bold">Editar Status</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        <FieldLabel>Novo status</FieldLabel>
                        <Select value={novoStatus} onValueChange={setNovoStatus}>
                            <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                <SelectItem value="Em negociação">Em negociação</SelectItem>
                                <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                                <SelectItem value="Fechada">Fechada</SelectItem>
                                <SelectItem value="Perdida">Perdida</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setOpenEdit(false)} className="border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300">Cancelar</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            onClick={async () => {
                                if (!vendaEditando) return;
                                await updateVendaStatus(vendaEditando.id, novoStatus);
                                setOpenEdit(false);
                                setVendaEditando(null);
                                loadAll();
                            }}
                        >
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}