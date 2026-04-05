import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Plus, Search, Filter, MapPin, BedDouble, Bath,
    Maximize, Landmark, MoreVertical, Share2, Eye,
    CheckCircle2, Building2, DollarSign, Car,
    Home, Store, Trees, Building, Warehouse,
    Tractor, TreePine, Castle, TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";

import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createImovel } from "@/integrations/supabase/imoveis/createImovel";
import { updateImovel } from "@/integrations/supabase/imoveis/updateImovel";
import { deleteImovel } from "@/integrations/supabase/imoveis/deleteImovel";


const TIPO_CONFIG: Record<string, { icon: React.ReactNode; bg: string; iconColor: string }> = {
    "Terreno": { icon: <Trees className="w-9 h-9" />, bg: "from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/10", iconColor: "text-green-500 dark:text-green-400" },
    "Lote Residencial": { icon: <Home className="w-9 h-9" />, bg: "from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/10", iconColor: "text-blue-500 dark:text-blue-400" },
    "Lote Comercial": { icon: <Store className="w-9 h-9" />, bg: "from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/10", iconColor: "text-amber-500 dark:text-amber-400" },
    "Lote em Condomínio": { icon: <Castle className="w-9 h-9" />, bg: "from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/10", iconColor: "text-purple-500 dark:text-purple-400" },
    "Lote Industrial": { icon: <Warehouse className="w-9 h-9" />, bg: "from-slate-100 to-slate-50 dark:from-slate-800/40 dark:to-slate-700/10", iconColor: "text-slate-500 dark:text-slate-400" },
    "Ágio": { icon: <TrendingUp className="w-9 h-9" />, bg: "from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/10", iconColor: "text-rose-500 dark:text-rose-400" },
    "Chácara": { icon: <TreePine className="w-9 h-9" />, bg: "from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/10", iconColor: "text-emerald-500 dark:text-emerald-400" },
    "Sítio": { icon: <Tractor className="w-9 h-9" />, bg: "from-lime-100 to-lime-50 dark:from-lime-900/30 dark:to-lime-800/10", iconColor: "text-lime-600 dark:text-lime-400" },
    "Fazenda": { icon: <Building className="w-9 h-9" />, bg: "from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/10", iconColor: "text-orange-500 dark:text-orange-400" },
};

const DEFAULT_CONFIG = {
    icon: <Landmark className="w-9 h-9" />,
    bg: "from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/10",
    iconColor: "text-blue-400 dark:text-blue-500",
};

function getTipoConfig(tipo: string) {
    return TIPO_CONFIG[tipo] ?? DEFAULT_CONFIG;
}

const TIPOS_LOTE = [
    "Terreno", "Lote Residencial", "Lote Comercial",
    "Lote em Condomínio", "Lote Industrial", "Ágio",
    "Chácara", "Sítio", "Fazenda",
];

const STATUS_OPTIONS = ["Ativo", "Inativo", "Vendido", "Reservado"];
const FASE_OBRA_OPTIONS = [
    "Sem fase definida", "Em lançamento", "Em obras",
    "Pronto para morar", "Concluído",
];
const ESTADOS_BR = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const emptyForm = {
    titulo: "", tipo: "", construtora: "", classificacao: "",
    id_canal_pro: "", status: "Ativo", fase_obra: "Sem fase definida",
    descricao: "", estado: "", cep: "", cidade: "", bairro: "",
    endereco: "", complemento: "",
    preco: "", renda_ideal: "", preco_varia: false,
    iptu: "", unidades_disponiveis: "", sob_consulta: false,
    area_minima: "", area_maxima: "", quartos: "", banheiros: "", vagas_garagem: "",
};

const inputClass =
    "bg-white dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-10";

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

const Loteamentos = () => {
    const [loteamentos, setLoteamentos] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState<any>(emptyForm);

    const setField = (key: string, value: any) =>
        setForm((prev: any) => ({ ...prev, [key]: value }));

    function openNew() {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    }

    function openEdit(item: any) {
        setEditing(item);
        setForm({
            titulo: item.titulo ?? "",
            tipo: item.tipo ?? "",
            construtora: item.construtora ?? "",
            classificacao: item.classificacao ?? "",
            id_canal_pro: item.id_canal_pro ?? "",
            status: item.status ?? "Ativo",
            fase_obra: item.fase_obra ?? "Sem fase definida",
            descricao: item.descricao ?? "",
            estado: item.estado ?? "",
            cep: item.cep ?? "",
            cidade: item.cidade ?? "",
            bairro: item.bairro ?? "",
            endereco: item.endereco ?? "",
            complemento: item.complemento ?? "",
            preco: item.preco ?? "",
            renda_ideal: item.renda_ideal ?? "",
            preco_varia: item.preco_varia ?? false,
            iptu: item.iptu ?? "",
            unidades_disponiveis: item.unidades_disponiveis ?? "",
            sob_consulta: item.sob_consulta ?? false,
            area_minima: item.area_minima ?? "",
            area_maxima: item.area_maxima ?? "",
            quartos: item.quartos ?? "",
            banheiros: item.banheiros ?? "",
            vagas_garagem: item.vagas_garagem ?? "",
        });
        setModalOpen(true);
    }

    async function load() {
        let res: any = await getImoveis();
        if (res?.data && Array.isArray(res.data)) res = res.data;
        if (!Array.isArray(res)) { setLoteamentos([]); return; }
        const only = res.filter((i: any) =>
            TIPOS_LOTE.includes(i.tipo) || i.tipo === "Loteamento"
        );
        setLoteamentos(only);
    }

    async function save() {
        if (!form.titulo?.trim()) { alert("Título é obrigatório"); return; }
        if (!form.tipo) { alert("Tipo é obrigatório"); return; }

        const payload = {
            ...form,
            preco: form.preco ? Number(form.preco) : null,
            renda_ideal: form.renda_ideal ? Number(form.renda_ideal) : null,
            iptu: form.iptu ? Number(form.iptu) : null,
            area_minima: form.area_minima ? Number(form.area_minima) : null,
            area_maxima: form.area_maxima ? Number(form.area_maxima) : null,
            quartos: form.quartos ? Number(form.quartos) : null,
            banheiros: form.banheiros ? Number(form.banheiros) : null,
            vagas_garagem: form.vagas_garagem ? Number(form.vagas_garagem) : null,
            unidades_disponiveis: form.unidades_disponiveis ? Number(form.unidades_disponiveis) : null,
        };

        try {
            if (editing) {
                await updateImovel(editing.id, payload);
            } else {
                await createImovel(payload);
            }
            setModalOpen(false);
            await load();
        } catch (err: any) {
            alert(err?.message ?? "Erro ao salvar loteamento");
        }
    }

    async function remove(id: string) {
        if (!confirm("Deseja remover este loteamento?")) return;
        await deleteImovel(id);
        await load();
    }

    useEffect(() => { load(); }, []);

    const filtered = loteamentos.filter((i) =>
        (i.titulo || "").toLowerCase().includes(search.toLowerCase())
    );

    const totalLoteamentos = loteamentos.length;
    const ativos = loteamentos.filter((i) => i.status === "Ativo" || i.ativo !== false).length;
    const vgvTotal = loteamentos.reduce((acc, i) => acc + (Number(i.preco) || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1623]">
            <Sidebar />

            <main className="ml-16 overflow-y-auto min-h-screen">
                <div className="p-8 space-y-6">


                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Loteamentos</h1>
                            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Gerencie seus loteamentos cadastrados</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 gap-2">
                                <Share2 className="w-4 h-4" /> Ativar meu Site
                            </Button>
                            <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-md shadow-blue-100 dark:shadow-blue-900/30">
                                <Plus className="w-4 h-4" /> Novo Loteamento
                            </Button>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Total de Loteamentos", value: totalLoteamentos, icon: <Building2 className="w-5 h-5 text-blue-500" />, iconBg: "bg-blue-50 dark:bg-blue-500/10" },
                            { label: "Loteamentos Ativos", value: ativos, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
                            { label: "Construtoras Cadastradas", value: 1, icon: <Landmark className="w-5 h-5 text-purple-500" />, iconBg: "bg-purple-50 dark:bg-purple-500/10" },
                            { label: "VGV Total", value: `R$ ${vgvTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5 text-amber-500" />, iconBg: "bg-amber-50 dark:bg-amber-500/10", large: true },
                        ].map((stat, i) => (
                            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#161e2e] p-5 flex items-center gap-4 shadow-sm">
                                <div className={`${stat.iconBg} rounded-lg p-3 flex-shrink-0`}>{stat.icon}</div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 uppercase tracking-wider font-medium">{stat.label}</p>
                                    <p className={`font-bold text-gray-900 dark:text-white mt-0.5 ${(stat as any).large ? "text-xl" : "text-2xl"}`}>{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    <div className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#161e2e] p-6 space-y-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por nome, endereço..."
                                    className="pl-10 bg-gray-50 dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="border-gray-200 dark:border-slate-700 text-gray-500 gap-2">
                                <Filter className="w-4 h-4" /> Filtros
                            </Button>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((item) => {
                                const config = getTipoConfig(item.tipo);
                                return (
                                    <div key={item.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#0f1623] hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-lg transition-all duration-200 group">


                                        <div className={`relative h-44 bg-gradient-to-br ${config.bg} flex items-center justify-center overflow-hidden`}>
                                            <div className={`${config.iconColor} opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300`}>
                                                {config.icon}
                                            </div>

                                            <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">
                                                    {item.status || "Ativo"}
                                                </span>
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-slate-200 shadow-sm backdrop-blur-sm">
                                                    {item.tipo}
                                                </span>
                                            </div>

                                            <div className="absolute top-2.5 right-2.5">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="w-6 h-6 rounded-md bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm">
                                                            <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                                        <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => openEdit(item)}>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-500 cursor-pointer text-sm" onClick={() => remove(item.id)}>Excluir</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>


                                        <div className="p-3 space-y-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{item.titulo}</h3>
                                                {(item.cidade || item.endereco) && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                                                            {[item.cidade, item.estado].filter(Boolean).join(", ") || item.endereco}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.descricao && (
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">{item.descricao}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                                                {item.quartos > 0 && <div className="flex items-center gap-1"><BedDouble className="w-3 h-3" /><span>{item.quartos}</span></div>}
                                                {item.banheiros > 0 && <div className="flex items-center gap-1"><Bath className="w-3 h-3" /><span>{item.banheiros}</span></div>}
                                                {(item.area_minima || item.area_maxima) && (
                                                    <div className="flex items-center gap-1">
                                                        <Maximize className="w-3 h-3" />
                                                        <span>
                                                            {item.area_minima && item.area_maxima
                                                                ? `${item.area_minima}–${item.area_maxima}m²`
                                                                : `${item.area_minima || item.area_maxima}m²`}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.vagas_garagem > 0 && <div className="flex items-center gap-1"><Car className="w-3 h-3" /><span>{item.vagas_garagem}</span></div>}
                                            </div>

                                            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                                                {item.sob_consulta ? (
                                                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">Sob consulta</p>
                                                ) : (
                                                    <>
                                                        <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                            {item.preco_varia ? "A partir de " : ""}
                                                            R$ {(Number(item.preco) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                        </p>
                                                        {item.renda_ideal > 0 && (
                                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                                                Renda ideal: R$ {Number(item.renda_ideal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                                {item.unidades_disponiveis > 0 && (
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                                        {item.unidades_disponiveis} unidades disponíveis
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 pt-0.5">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/10 dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20 gap-1 text-xs h-7 shadow-none"
                                                    onClick={() => openEdit(item)}
                                                >
                                                    <Eye className="w-3 h-3" /> Ver Detalhes
                                                </Button>
                                                <button className="w-7 h-7 rounded-md border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                                    <Share2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filtered.length === 0 && (
                            <div className="py-16 text-center">
                                <Landmark className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhum loteamento encontrado.</p>
                                <Button onClick={openNew} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                    <Plus className="w-4 h-4" /> Cadastrar primeiro loteamento
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>


            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-[#161e2e] border-gray-200 dark:border-slate-700 p-0">


                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white text-xl font-bold">
                                {editing ? "Editar Loteamento" : "Novo Loteamento"}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                                Preencha os dados do loteamento
                            </p>
                        </DialogHeader>


                        {form.tipo && (() => {
                            const cfg = getTipoConfig(form.tipo);
                            return (
                                <div className={`mt-4 rounded-xl h-20 bg-gradient-to-br ${cfg.bg} flex items-center justify-center gap-3`}>
                                    <div className={`${cfg.iconColor} opacity-70`}>{cfg.icon}</div>
                                    <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">{form.tipo}</span>
                                </div>
                            );
                        })()}
                    </div>


                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-8">


                        <section>
                            <SectionTitle icon={<Building2 className="w-5 h-5" />} title="Dados da Venda" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <FieldLabel required>Nome do Loteamento</FieldLabel>
                                    <Input placeholder="Ex: Jardim das Palmeiras" value={form.titulo} onChange={(e) => setField("titulo", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel required>Tipo</FieldLabel>
                                    <Select value={form.tipo} onValueChange={(v) => setField("tipo", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {TIPOS_LOTE.map((t) => (
                                                <SelectItem key={t} value={t} className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-600/20">{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>Construtora / Incorporadora</FieldLabel>
                                    <Input placeholder="Nome da construtora" value={form.construtora} onChange={(e) => setField("construtora", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Classificação</FieldLabel>
                                    <Select value={form.classificacao} onValueChange={(v) => setField("classificacao", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {["Econômico", "Médio", "Alto Padrão", "Luxo"].map((c) => (
                                                <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>ID Canal Pro</FieldLabel>
                                    <Input placeholder="Ex: 139229" value={form.id_canal_pro} onChange={(e) => setField("id_canal_pro", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel required>Status</FieldLabel>
                                    <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="cursor-pointer">{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>Fase da Obra</FieldLabel>
                                    <Select value={form.fase_obra} onValueChange={(v) => setField("fase_obra", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {FASE_OBRA_OPTIONS.map((f) => <SelectItem key={f} value={f} className="cursor-pointer">{f}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <FieldLabel>Descrição</FieldLabel>
                                    <Textarea placeholder="Descrição do loteamento..." value={form.descricao} onChange={(e) => setField("descricao", e.target.value)} className="bg-white dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 min-h-[96px] resize-none focus:border-blue-500" />
                                </div>
                            </div>
                        </section>


                        <section>
                            <SectionTitle icon={<MapPin className="w-5 h-5" />} title="Localização" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Estado</FieldLabel>
                                    <Select value={form.estado} onValueChange={(v) => setField("estado", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700 max-h-48">
                                            {ESTADOS_BR.map((e) => <SelectItem key={e} value={e} className="cursor-pointer">{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>CEP</FieldLabel>
                                    <Input placeholder="00000-000" value={form.cep} onChange={(e) => setField("cep", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Cidade</FieldLabel>
                                    <Input placeholder="Cidade" value={form.cidade} onChange={(e) => setField("cidade", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Bairro</FieldLabel>
                                    <Input placeholder="Bairro" value={form.bairro} onChange={(e) => setField("bairro", e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <FieldLabel>Endereço</FieldLabel>
                                    <Input placeholder="Rua, Avenida, etc." value={form.endereco} onChange={(e) => setField("endereco", e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <FieldLabel>Complemento</FieldLabel>
                                    <Input placeholder="Quadra, Setor, etc." value={form.complemento} onChange={(e) => setField("complemento", e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </section>


                        <section>
                            <SectionTitle icon={<DollarSign className="w-5 h-5" />} title="Valores e Unidades" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Valor</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.preco} onChange={(e) => setField("preco", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Renda Ideal</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.renda_ideal} onChange={(e) => setField("renda_ideal", e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800/50">
                                        <Checkbox id="preco_varia" checked={form.preco_varia} onCheckedChange={(v) => setField("preco_varia", v)} className="mt-0.5 border-gray-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                                        <div>
                                            <label htmlFor="preco_varia" className="text-sm font-medium text-gray-700 dark:text-slate-200 cursor-pointer">Preço varia conforme unidade</label>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Exibirá "A partir de" no catálogo</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <FieldLabel>IPTU</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.iptu} onChange={(e) => setField("iptu", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel required>Unidades Disponíveis</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.unidades_disponiveis} onChange={(e) => setField("unidades_disponiveis", e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800/50">
                                        <Checkbox id="sob_consulta" checked={form.sob_consulta} onCheckedChange={(v) => setField("sob_consulta", v)} className="mt-0.5 border-gray-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                                        <div>
                                            <label htmlFor="sob_consulta" className="text-sm font-medium text-gray-700 dark:text-slate-200 cursor-pointer">Sob consulta</label>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Oculta a quantidade exata e exibe "Sob consulta"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>


                        <section>
                            <SectionTitle icon={<Maximize className="w-5 h-5" />} title="Características" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Área Mínima (m²)</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.area_minima} onChange={(e) => setField("area_minima", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Área Máxima (m²)</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.area_maxima} onChange={(e) => setField("area_maxima", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Quartos</FieldLabel>
                                    <Select value={String(form.quartos || "")} onValueChange={(v) => setField("quartos", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {["0", "1", "2", "3", "4", "5+"].map((q) => <SelectItem key={q} value={q} className="cursor-pointer">{q}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>Banheiros</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.banheiros} onChange={(e) => setField("banheiros", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel>Vagas de Garagem</FieldLabel>
                                    <Input placeholder="0" type="number" value={form.vagas_garagem} onChange={(e) => setField("vagas_garagem", e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </section>

                    </div>


                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-3 flex-shrink-0 bg-white dark:bg-[#161e2e]">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300">
                            Cancelar
                        </Button>
                        <Button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
                            {editing ? "Salvar Alterações" : "Criar Loteamento"}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Loteamentos;