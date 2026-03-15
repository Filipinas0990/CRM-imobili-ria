import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Users, UserCheck, UserX, Building2, Upload } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/components/ui/use-toast";

import { getColaboradores } from "@/integrations/supabase/Configuracoes/Getcolaboradores";
import { createColaborador } from "@/integrations/supabase/Configuracoes/Createcolaborador";
import { updateColaborador } from "@/integrations/supabase/Configuracoes/updateColaborador";
import { deleteColaborador } from "@/integrations/supabase/Configuracoes/deleteColaborador";
import { getEmpresa } from "@/integrations/supabase/Configuracoes/geteEmpresa";
import { upsertEmpresa } from "@/integrations/supabase/Configuracoes/Upsertempresa";

type Colaborador = {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    cargo: string;
    creci?: string;
    comissao: number;
    status: "Ativo" | "Inativo";
};

type Empresa = {
    id?: string;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    site?: string;
    cep?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    creci_juridico?: string;
    responsavel?: string;
    descricao?: string;
};

const CARGOS = [
    "Corretor",
    "Corretora",
    "Corretor Senior",
    "Corretora Senior",
    "Gerente Comercial",
    "Assistente",
    "Sócio",
    "Diretor",
];

const FORM_VAZIO: Omit<Colaborador, "id"> = {
    nome: "",
    email: "",
    telefone: "",
    cargo: "Corretor",
    creci: "",
    comissao: 5,
    status: "Ativo",
};

const EMP_VAZIO: Empresa = {
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    site: "",
    cep: "",
    endereco: "",
    cidade: "",
    estado: "",
    creci_juridico: "",
    responsavel: "",
    descricao: "",
};

// ─── Avatar com iniciais ──────────────────────────────────────────────────────
function Avatar({ nome }: { nome: string }) {
    const initials = nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const colors = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-red-500", "bg-cyan-500"];
    const bg = colors[nome.charCodeAt(0) % colors.length];
    return (
        <div className={`h-9 w-9 rounded-full ${bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials}
        </div>
    );
}


function Field({
    label, value, onChange, type = "text", placeholder = "", required = false,
}: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; required?: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-green-600 outline-none transition"
            />
        </div>
    );
}


// ABA EQUIPE

function TabEquipe() {
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filtro, setFiltro] = useState("Todos");

    const [openModal, setOpenModal] = useState(false);
    const [editando, setEditando] = useState<Colaborador | null>(null);
    const [form, setForm] = useState(FORM_VAZIO);

    const [deleteDialog, setDeleteDialog] = useState<Colaborador | null>(null);

    const { toast } = useToast();

    async function load() {
        setLoading(true);
        const data = await getColaboradores();
        setColaboradores(data || []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    function openNovo() {
        setEditando(null);
        setForm(FORM_VAZIO);
        setOpenModal(true);
    }

    function openEdit(c: Colaborador) {
        setEditando(c);
        setForm({ nome: c.nome, email: c.email, telefone: c.telefone ?? "", cargo: c.cargo, creci: c.creci ?? "", comissao: c.comissao, status: c.status });
        setOpenModal(true);
    }

    async function handleSalvar() {
        if (!form.nome.trim() || !form.email.trim()) {
            toast({ title: "Nome e e-mail são obrigatórios.", className: "bg-red-600 text-white" });
            return;
        }
        setSaving(true);
        if (editando) {
            await updateColaborador(editando.id, form);
            toast({ title: "Colaborador atualizado!", className: "bg-green-600 text-white" });
        } else {
            await createColaborador(form);
            toast({ title: "Colaborador cadastrado!", className: "bg-green-600 text-white" });
        }
        setSaving(false);
        setOpenModal(false);
        load();
    }

    async function handleDelete() {
        if (!deleteDialog) return;
        await deleteColaborador(deleteDialog.id);
        toast({ title: "Colaborador removido.", className: "bg-green-600 text-white" });
        setDeleteDialog(null);
        load();
    }

    const f = (k: keyof typeof form) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

    const ativos = colaboradores.filter((c) => c.status === "Ativo").length;
    const inativos = colaboradores.filter((c) => c.status === "Inativo").length;
    const lista = filtro === "Todos" ? colaboradores : colaboradores.filter((c) => c.status === filtro);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="text-blue-600 h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total de Colaboradores</p>
                        <p className="text-2xl font-bold text-foreground">{colaboradores.length}</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <UserCheck className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Ativos</p>
                        <p className="text-2xl font-bold text-foreground">{ativos}</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <UserX className="text-amber-500 h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Inativos</p>
                        <p className="text-2xl font-bold text-foreground">{inativos}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <Select value={filtro} onValueChange={setFiltro}>
                    <SelectTrigger className="w-[160px] h-10 bg-background">
                        <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Ativo">Ativos</SelectItem>
                        <SelectItem value="Inativo">Inativos</SelectItem>
                    </SelectContent>
                </Select>

                <Button className="bg-green-700 hover:bg-green-800" onClick={openNovo}>
                    + Novo Colaborador
                </Button>
            </div>

            {/* Tabela */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            {["Colaborador", "Cargo", "CRECI", "Comissão", "Status", "Ações"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Carregando colaboradores...</td></tr>
                        ) : lista.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum colaborador encontrado.</td></tr>
                        ) : lista.map((c) => (
                            <tr key={c.id} className="hover:bg-muted/40 transition">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar nome={c.nome} />
                                        <div>
                                            <p className="font-medium text-foreground">{c.nome}</p>
                                            <p className="text-xs text-muted-foreground">{c.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-foreground">{c.cargo}</td>
                                <td className="px-4 py-4 text-muted-foreground">{c.creci || "—"}</td>
                                <td className="px-4 py-4 font-semibold text-foreground">{c.comissao}%</td>
                                <td className="px-4 py-4">
                                    <Badge className={c.status === "Ativo" ? "bg-green-700 hover:bg-green-700" : "bg-muted text-muted-foreground hover:bg-muted"}>
                                        {c.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                            <Pencil className="h-4 w-4 text-green-700" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog(c)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Cadastro / Edição */}
            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Field label="Nome completo" value={form.nome} onChange={f("nome")} placeholder="Nome completo" required />
                        </div>
                        <Field label="E-mail" value={form.email} onChange={f("email")} placeholder="email@exemplo.com" type="email" required />
                        <Field label="Telefone" value={form.telefone ?? ""} onChange={f("telefone")} placeholder="(11) 99999-0000" />

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cargo</label>
                            <Select value={form.cargo} onValueChange={f("cargo")}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CARGOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <Field label="CRECI" value={form.creci ?? ""} onChange={f("creci")} placeholder="F-00000" />

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comissão (%)</label>
                            <input
                                type="number"
                                value={form.comissao}
                                onChange={(e) => f("comissao")(Number(e.target.value))}
                                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-green-600 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</label>
                            <Select value={form.status} onValueChange={f("status")}>
                                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                    <SelectItem value="Inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
                        <Button className="bg-green-700 hover:bg-green-800" onClick={handleSalvar} disabled={saving}>
                            {saving ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Confirmar Delete */}
            <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover colaborador?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{deleteDialog?.nome}</strong> será removido permanentemente. Essa ação não pode ser desfeita.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Remover</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// ABA EMPRESA

function TabEmpresa() {
    const [emp, setEmp] = useState<Empresa>(EMP_VAZIO);
    const [empId, setEmpId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        async function load() {
            const data = await getEmpresa();
            if (data) { setEmp(data); setEmpId(data.id ?? null); }
            setLoading(false);
        }
        load();
    }, []);

    async function handleSalvar() {
        if (!emp.nome.trim()) {
            toast({ title: "Razão social é obrigatória.", className: "bg-red-600 text-white" });
            return;
        }
        setSaving(true);
        await upsertEmpresa({ ...emp, id: empId ?? undefined });
        toast({ title: "Dados da empresa salvos!", className: "bg-green-600 text-white" });
        setSaving(false);
    }

    const f = (k: keyof Empresa) => (v: string) => setEmp((p) => ({ ...p, [k]: v }));

    if (loading) return <p className="text-muted-foreground">Carregando dados da empresa...</p>;

    return (
        <div className="space-y-4 max-w-3xl">
            {/* Logo */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-5">
                <div className="h-16 w-16 rounded-xl bg-green-900 flex items-center justify-center shrink-0">
                    <span className="text-green-400 font-extrabold text-xl">
                        {emp.nome ? emp.nome.slice(0, 2).toUpperCase() : "IC"}
                    </span>
                </div>
                <div>
                    <p className="font-semibold text-foreground">Logo da Empresa</p>
                    <p className="text-xs text-muted-foreground mb-3">PNG ou JPG · recomendado 200×200px</p>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-3.5 w-3.5" /> Enviar Logo
                    </Button>
                </div>
            </div>

            {/* Dados da empresa */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Dados da Empresa</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <Field label="Razão Social / Nome" value={emp.nome} onChange={f("nome")} placeholder="Nome da empresa" required />
                    </div>
                    <Field label="CNPJ" value={emp.cnpj ?? ""} onChange={f("cnpj")} placeholder="00.000.000/0001-00" />
                    <Field label="CRECI Jurídico" value={emp.creci_juridico ?? ""} onChange={f("creci_juridico")} placeholder="J-00000" />
                    <div className="col-span-2">
                        <Field label="Responsável" value={emp.responsavel ?? ""} onChange={f("responsavel")} placeholder="Nome do responsável" />
                    </div>
                </div>
            </div>

            {/* Contato */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <span className="font-semibold text-foreground">Contato</span>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="E-mail" value={emp.email ?? ""} onChange={f("email")} placeholder="contato@empresa.com" type="email" />
                    <Field label="Telefone" value={emp.telefone ?? ""} onChange={f("telefone")} placeholder="(00) 00000-0000" />
                    <div className="col-span-2">
                        <Field label="Site" value={emp.site ?? ""} onChange={f("site")} placeholder="www.empresa.com" />
                    </div>
                </div>
            </div>

            {/* Endereço */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <span className="font-semibold text-foreground">Endereço</span>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="CEP" value={emp.cep ?? ""} onChange={f("cep")} placeholder="00000-000" />
                    <Field label="Estado" value={emp.estado ?? ""} onChange={f("estado")} placeholder="SP" />
                    <div className="col-span-2">
                        <Field label="Endereço" value={emp.endereco ?? ""} onChange={f("endereco")} placeholder="Rua, número, complemento" />
                    </div>
                    <div className="col-span-2">
                        <Field label="Cidade" value={emp.cidade ?? ""} onChange={f("cidade")} placeholder="São Paulo" />
                    </div>
                </div>
            </div>

            {/* Descrição */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição / Observações</label>
                <textarea
                    value={emp.descricao ?? ""}
                    onChange={(e) => f("descricao")(e.target.value)}
                    placeholder="Informações adicionais sobre a empresa..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-green-600 outline-none resize-y"
                />
            </div>

            <div className="flex justify-end">
                <Button className="bg-green-700 hover:bg-green-800" onClick={handleSalvar} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Dados"}
                </Button>
            </div>
        </div>
    );
}


const TABS = [
    { id: "equipe", label: "Equipe" },
    //{ id: "empresa", label: "Empresa" },
];

export default function Configuracoes() {
    const [tab, setTab] = useState("equipe");

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <main className="ml-16 p-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Configurações</h1>
                    <p className="text-muted-foreground">Gerencie sua equipe, empresa e preferências do sistema</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-border flex gap-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id
                                ? "border-green-700 text-green-700"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Conteúdo */}
                {tab === "equipe" && <TabEquipe />}
                {tab === "empresa" && <TabEmpresa />}
            </main>
        </div>
    );
}