import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Plus, Search, Filter, MapPin, BedDouble, Bath,
    Maximize, Landmark, MoreVertical, Share2, Eye,
    CheckCircle2, Building2, DollarSign, Car,
    Home, Store, Building, Warehouse,
    BedSingle, Hotel, Coffee
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

import { Sidebar } from "@/components/Sidebar";
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createImovel } from "@/integrations/supabase/imoveis/createImovel";
import { updateImovel } from "@/integrations/supabase/imoveis/updateImovel";
import { deleteImovel } from "@/integrations/supabase/imoveis/deleteImovel";


const TIPO_CONFIG: Record<string, { icon: React.ReactNode; bg: string; iconColor: string }> = {
    "Apartamento": { icon: <Building2 className="w-9 h-9" />, bg: "from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/10", iconColor: "text-blue-500 dark:text-blue-400" },
    "Casa": { icon: <Home className="w-9 h-9" />, bg: "from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/10", iconColor: "text-green-500 dark:text-green-400" },
    "Casa em Condomínio": { icon: <Home className="w-9 h-9" />, bg: "from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/10", iconColor: "text-emerald-500 dark:text-emerald-400" },
    "Sala Comercial": { icon: <Store className="w-9 h-9" />, bg: "from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/10", iconColor: "text-amber-500 dark:text-amber-400" },
    "Loja": { icon: <Store className="w-9 h-9" />, bg: "from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/10", iconColor: "text-orange-500 dark:text-orange-400" },
    "Galpão / Depósito": { icon: <Warehouse className="w-9 h-9" />, bg: "from-slate-100 to-slate-50 dark:from-slate-800/40 dark:to-slate-700/10", iconColor: "text-slate-500 dark:text-slate-400" },
    "Kitnet": { icon: <BedSingle className="w-9 h-9" />, bg: "from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/10", iconColor: "text-violet-500 dark:text-violet-400" },
    "Studio": { icon: <Coffee className="w-9 h-9" />, bg: "from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/10", iconColor: "text-rose-500 dark:text-rose-400" },
    "Cobertura": { icon: <Hotel className="w-9 h-9" />, bg: "from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/10", iconColor: "text-purple-500 dark:text-purple-400" },
    "Flat": { icon: <Building className="w-9 h-9" />, bg: "from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/10", iconColor: "text-cyan-500 dark:text-cyan-400" },
    "Ponto Comercial": { icon: <Store className="w-9 h-9" />, bg: "from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-800/10", iconColor: "text-pink-500 dark:text-pink-400" },
};

const DEFAULT_CONFIG = {
    icon: <Landmark className="w-9 h-9" />,
    bg: "from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/10",
    iconColor: "text-blue-400 dark:text-blue-500",
};

function getTipoConfig(tipo: string) {
    return TIPO_CONFIG[tipo] ?? DEFAULT_CONFIG;
}

const TIPOS_ALUGUEL = [
    "Apartamento", "Casa", "Casa em Condomínio", "Sala Comercial",
    "Loja", "Galpão / Depósito", "Kitnet", "Studio",
    "Cobertura", "Flat", "Ponto Comercial",
];

const STATUS_OPTIONS = ["Disponível", "Alugado", "Reservado", "Indisponível"];
const PERIODO_OPTIONS = ["Mensal", "Anual", "Temporada", "Diária"];
const ESTADOS_BR = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const emptyForm = {
    titulo: "", tipo: "", construtora: "", classificacao: "",
    status: "Disponível", periodo_aluguel: "Mensal", descricao: "",
    estado: "", cep: "", cidade: "", bairro: "", endereco: "", complemento: "",
    preco: "", condominio: "", iptu: "", deposito: "",
    aceita_pets: false, mobiliado: false, sob_consulta: false,
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

const Alugueis = () => {
    const [alugueis, setAlugueis] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState<any>(emptyForm);
    const [loading, setLoading] = useState(true);


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
            status: item.status ?? "Disponível",
            periodo_aluguel: item.periodo_aluguel ?? "Mensal",
            descricao: item.descricao ?? "",
            estado: item.estado ?? "",
            cep: item.cep ?? "",
            cidade: item.cidade ?? "",
            bairro: item.bairro ?? "",
            endereco: item.endereco ?? "",
            complemento: item.complemento ?? "",
            preco: item.preco ?? "",
            condominio: item.condominio ?? "",
            iptu: item.iptu ?? "",
            deposito: item.deposito ?? "",
            aceita_pets: item.aceita_pets ?? false,
            mobiliado: item.mobiliado ?? false,
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
        setLoading(true);
        let res: any = await getImoveis();
        if (res?.data && Array.isArray(res.data)) res = res.data;
        if (!Array.isArray(res)) { setAlugueis([]); setLoading(false); return; }
        setAlugueis(res.filter((i: any) => TIPOS_ALUGUEL.includes(i.tipo)));
        setLoading(false);
    }

    async function save() {
        if (!form.titulo?.trim()) { alert("Título é obrigatório"); return; }
        if (!form.tipo) { alert("Tipo é obrigatório"); return; }

        const payload = {
            ...form,
            preco: form.preco ? Number(form.preco) : null,
            condominio: form.condominio ? Number(form.condominio) : null,
            iptu: form.iptu ? Number(form.iptu) : null,
            deposito: form.deposito ? Number(form.deposito) : null,
            area_minima: form.area_minima ? Number(form.area_minima) : null,
            area_maxima: form.area_maxima ? Number(form.area_maxima) : null,
            quartos: form.quartos ? Number(form.quartos) : null,
            banheiros: form.banheiros ? Number(form.banheiros) : null,
            vagas_garagem: form.vagas_garagem ? Number(form.vagas_garagem) : null,
        };

        try {
            editing ? await updateImovel(editing.id, payload) : await createImovel(payload);
            setModalOpen(false);
            await load();
        } catch (err: any) {
            alert(err?.message ?? "Erro ao salvar");
        }
    }

    async function remove(id: string) {
        if (!confirm("Deseja remover este imóvel?")) return;
        await deleteImovel(id);
        await load();
    }

    useEffect(() => { load(); }, []);

    const filtered = alugueis.filter((i) => (i.titulo || "").toLowerCase().includes(search.toLowerCase()));
    const total = alugueis.length;
    const disponiveis = alugueis.filter((i) => i.status === "Disponível").length;
    const alugados = alugueis.filter((i) => i.status === "Alugado").length;
    const receitaMensal = alugueis.filter((i) => i.status === "Alugado").reduce((acc, i) => acc + (Number(i.preco) || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1623]">
            <Sidebar />
            <main className="ml-16 overflow-y-auto min-h-screen">
                <div className="p-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Aluguéis</h1>
                            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Gerencie seus imóveis para aluguel</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/*} <Button variant="outline" className="border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 gap-2">
                                <Share2 className="w-4 h-4" /> Ativar meu Site
                            </Button>
                            */}
                            <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-md">
                                <Plus className="w-4 h-4" /> Novo Aluguel
                            </Button>

                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Total de Imóveis", value: total, icon: <Building2 className="w-5 h-5 text-blue-500" />, iconBg: "bg-blue-50 dark:bg-blue-500/10" },
                            { label: "Disponíveis", value: disponiveis, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
                            { label: "Alugados", value: alugados, icon: <Landmark className="w-5 h-5 text-purple-500" />, iconBg: "bg-purple-50 dark:bg-purple-500/10" },
                            { label: "Receita Mensal", value: `R$ ${receitaMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5 text-amber-500" />, iconBg: "bg-amber-50 dark:bg-amber-500/10", large: true },
                        ].map((s, i) => (
                            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#161e2e] p-9 flex items-center gap-4 shadow-sm">
                                <div className={`${s.iconBg} rounded-lg p-3 flex-shrink-0`}>{s.icon}</div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 uppercase tracking-wider font-medium">{s.label}</p>
                                    <p className={`font-bold text-gray-900 dark:text-white mt-0.5 ${(s as any).large ? "text-xl" : "text-2xl"}`}>{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    <div className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-[#161e2e] p-6 space-y-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input placeholder="Buscar aluguéis..." className="pl-10 bg-gray-50 dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400" value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            {/* <Button variant="outline" className="border-gray-200 dark:border-slate-700 text-gray-500 gap-2">
                                <Filter className="w-4 h-4" /> Filtros
                            </Button>
                         */}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#0f1623] animate-pulse">
                                        <div className="h-56 bg-gray-100 dark:bg-slate-800" />
                                        <div className="p-3 space-y-2">
                                            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
                                            <div className="h-7 bg-gray-100 dark:bg-slate-800 rounded mt-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filtered.map((item) => {
                                        const config = getTipoConfig(item.tipo);
                                        return (
                                            <div key={item.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#0f1623] hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-lg transition-all duration-200 group">

                                                <div className={`relative h-56 bg-gradient-to-br ${config.bg} flex items-center justify-center overflow-hidden`}>
                                                    <div className={`${config.iconColor} opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300`}>
                                                        {config.icon}
                                                    </div>
                                                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">{item.status || "Disponível"}</span>
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-slate-200 shadow-sm backdrop-blur-sm">{item.tipo}</span>
                                                    </div>
                                                    <div className="absolute top-2.5 right-2.5">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="w-6 h-6 rounded-md bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm">
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
                                                        {item.descricao && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">{item.descricao}</p>}
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                                                        {item.quartos > 0 && <div className="flex items-center gap-1"><BedDouble className="w-3 h-3" /><span>{item.quartos}</span></div>}
                                                        {item.banheiros > 0 && <div className="flex items-center gap-1"><Bath className="w-3 h-3" /><span>{item.banheiros}</span></div>}
                                                        {(item.area_minima || item.area_maxima) && (
                                                            <div className="flex items-center gap-1">
                                                                <Maximize className="w-3 h-3" />
                                                                <span>{item.area_minima && item.area_maxima ? `${item.area_minima}–${item.area_maxima}m²` : `${item.area_minima || item.area_maxima}m²`}</span>
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
                                                                    R$ {(Number(item.preco) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                                    <span className="text-xs font-normal text-gray-400 ml-1">/{item.periodo_aluguel || "mês"}</span>
                                                                </p>
                                                                {item.condominio > 0 && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Condomínio: R$ {Number(item.condominio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                                                            </>
                                                        )}
                                                        <div className="flex gap-2 mt-1">
                                                            {item.mobiliado && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Mobiliado</span>}
                                                            {item.aceita_pets && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">Aceita pets</span>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-0.5">
                                                        <Button size="sm" className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/10 dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20 gap-1 text-xs h-7 shadow-none" onClick={() => openEdit(item)}>
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
                                        <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhum aluguel encontrado.</p>
                                        <Button onClick={openNew} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                            <Plus className="w-4 h-4" /> Cadastrar primeiro imóvel
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>


            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-[#161e2e] border-gray-200 dark:border-slate-700 p-0">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white text-xl font-bold">{editing ? "Editar Aluguel" : "Novo Aluguel"}</DialogTitle>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Preencha os dados do imóvel</p>
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
                            <SectionTitle icon={<Building2 className="w-5 h-5" />} title="Dados do Imóvel" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <FieldLabel required>Título</FieldLabel>
                                    <Input placeholder="Ex: Apartamento Centro" value={form.titulo} onChange={(e) => setField("titulo", e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <FieldLabel required>Tipo</FieldLabel>
                                    <Select value={form.tipo} onValueChange={(v) => setField("tipo", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {TIPOS_ALUGUEL.map((t) => <SelectItem key={t} value={t} className="cursor-pointer">{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
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
                                    <FieldLabel>Período</FieldLabel>
                                    <Select value={form.periodo_aluguel} onValueChange={(v) => setField("periodo_aluguel", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {PERIODO_OPTIONS.map((p) => <SelectItem key={p} value={p} className="cursor-pointer">{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>Proprietário / Imobiliária</FieldLabel>
                                    <Input placeholder="Nome do proprietário" value={form.construtora} onChange={(e) => setField("construtora", e.target.value)} className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <FieldLabel>Descrição</FieldLabel>
                                    <Textarea placeholder="Descrição do imóvel..." value={form.descricao} onChange={(e) => setField("descricao", e.target.value)} className="bg-white dark:bg-[#0f1623] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 placeholder:text-gray-400 min-h-[80px] resize-none focus:border-blue-500" />
                                </div>
                            </div>
                        </section>


                        <section>
                            <SectionTitle icon={<MapPin className="w-5 h-5" />} title="Localização" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Estado</FieldLabel>
                                    <Select value={form.estado} onValueChange={(v) => setField("estado", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700 max-h-48">
                                            {ESTADOS_BR.map((e) => <SelectItem key={e} value={e} className="cursor-pointer">{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><FieldLabel>CEP</FieldLabel><Input placeholder="00000-000" value={form.cep} onChange={(e) => setField("cep", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>Cidade</FieldLabel><Input placeholder="Cidade" value={form.cidade} onChange={(e) => setField("cidade", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>Bairro</FieldLabel><Input placeholder="Bairro" value={form.bairro} onChange={(e) => setField("bairro", e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><FieldLabel>Endereço</FieldLabel><Input placeholder="Rua, número..." value={form.endereco} onChange={(e) => setField("endereco", e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2"><FieldLabel>Complemento</FieldLabel><Input placeholder="Apto, Bloco..." value={form.complemento} onChange={(e) => setField("complemento", e.target.value)} className={inputClass} /></div>
                            </div>
                        </section>


                        <section>
                            <SectionTitle icon={<DollarSign className="w-5 h-5" />} title="Valores" />
                            <div className="grid grid-cols-2 gap-4">
                                <div><FieldLabel required>Valor do Aluguel</FieldLabel><Input placeholder="0" type="number" value={form.preco} onChange={(e) => setField("preco", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>Condomínio</FieldLabel><Input placeholder="0" type="number" value={form.condominio} onChange={(e) => setField("condominio", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>IPTU</FieldLabel><Input placeholder="0" type="number" value={form.iptu} onChange={(e) => setField("iptu", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>Depósito / Caução</FieldLabel><Input placeholder="0" type="number" value={form.deposito} onChange={(e) => setField("deposito", e.target.value)} className={inputClass} /></div>
                                <div className="col-span-2 flex flex-col gap-3">
                                    {[
                                        { id: "sob_consulta", label: "Sob consulta", sub: "Oculta o valor e exibe 'Sob consulta'" },
                                        { id: "mobiliado", label: "Mobiliado", sub: "Imóvel entregue com móveis" },
                                        { id: "aceita_pets", label: "Aceita pets", sub: "Permite animais de estimação" },
                                    ].map(({ id, label, sub }) => (
                                        <div key={id} className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800/50">
                                            <Checkbox id={id} checked={form[id]} onCheckedChange={(v) => setField(id, v)} className="mt-0.5 border-gray-300 dark:border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                                            <div>
                                                <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-slate-200 cursor-pointer">{label}</label>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>


                        <section>
                            <SectionTitle icon={<Maximize className="w-5 h-5" />} title="Características" />
                            <div className="grid grid-cols-2 gap-4">
                                <div><FieldLabel>Área Mínima (m²)</FieldLabel><Input placeholder="0" type="number" value={form.area_minima} onChange={(e) => setField("area_minima", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>Área Máxima (m²)</FieldLabel><Input placeholder="0" type="number" value={form.area_maxima} onChange={(e) => setField("area_maxima", e.target.value)} className={inputClass} /></div>
                                <div>
                                    <FieldLabel>Quartos</FieldLabel>
                                    <Select value={String(form.quartos || "")} onValueChange={(v) => setField("quartos", v)}>
                                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e2a3a] border-gray-100 dark:border-slate-700">
                                            {["0", "1", "2", "3", "4", "5+"].map((q) => <SelectItem key={q} value={q} className="cursor-pointer">{q}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><FieldLabel>Banheiros</FieldLabel><Input placeholder="0" type="number" value={form.banheiros} onChange={(e) => setField("banheiros", e.target.value)} className={inputClass} /></div>
                                <div><FieldLabel>Vagas de Garagem</FieldLabel><Input placeholder="0" type="number" value={form.vagas_garagem} onChange={(e) => setField("vagas_garagem", e.target.value)} className={inputClass} /></div>
                            </div>
                        </section>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-3 flex-shrink-0 bg-white dark:bg-[#161e2e]">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300">Cancelar</Button>
                        <Button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">{editing ? "Salvar Alterações" : "Criar Aluguel"}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Alugueis;