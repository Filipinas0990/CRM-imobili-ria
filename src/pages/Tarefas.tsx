import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
    Plus, List, Calendar, Phone, Users, CheckSquare, Flag,
    Mail, Coffee, Filter, MoreHorizontal, ChevronDown, Trash2, MoreVertical,
} from "lucide-react"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { tarefaService, Tarefa, TarefaTipo, TarefaStatus, CreateTarefaPayload } from "@/services/tarefa.service"
import { leadService } from "@/services/lead.service"

type TipoFiltro = "all" | TarefaTipo

const tiposAtividade = [
    { id: "all", label: "Tudo", icon: null },
    { id: "chamada", label: "Chamada", icon: Phone },
    { id: "reuniao", label: "Reuniao", icon: Users },
    { id: "tarefa", label: "Tarefa", icon: CheckSquare },
    { id: "prazo", label: "Prazo", icon: Flag },
    { id: "email", label: "E-mail", icon: Mail },
    { id: "almoco", label: "Almoco", icon: Coffee },
]

function getIconForType(tipo: TarefaTipo) {
    switch (tipo) {
        case "chamada": return <Phone className="h-4 w-4 text-emerald-600" />
        case "reuniao": return <Users className="h-4 w-4 text-violet-600" />
        case "tarefa": return <CheckSquare className="h-4 w-4 text-blue-600" />
        case "prazo": return <Flag className="h-4 w-4 text-orange-600" />
        case "email": return <Mail className="h-4 w-4 text-sky-600" />
        case "almoco": return <Coffee className="h-4 w-4 text-amber-600" />
        default: return null
    }
}

function getStatusBadge(status: TarefaStatus) {
    if (status === "PENDENTE") return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pendente</Badge>
    if (status === "EM_ANDAMENTO") return <Badge className="bg-blue-100 text-blue-800 border-0">Em andamento</Badge>
    if (status === "CONCLUÍDA") return <Badge className="bg-green-100 text-green-800 border-0">Concluída</Badge>
    if (status === "CANCELADA") return <Badge className="bg-red-100 text-red-800 border-0">Cancelada</Badge>
    return null
}

const defaultPayload: CreateTarefaPayload = {
    lead_id: "", tipo: "tarefa", titulo: "", descricao: "",
    data_inicio: "", data_fim: "", status: "PENDENTE", prioridade: "normal",
}

// ─── Card Mobile ─────────────────────────────────────────────────
function AtividadeCard({ tarefa, onToggle, onEditar, onExcluir }: {
    tarefa: Tarefa
    onToggle: () => void
    onEditar: () => void
    onExcluir: () => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const concluido = tarefa.status === "CONCLUÍDA"
    const atrasada = !concluido && tarefa.data_inicio && new Date(tarefa.data_inicio) < new Date()

    return (
        <div className={cn(
            "relative rounded-2xl border bg-card shadow-sm overflow-hidden transition-all active:scale-[0.98]",
            concluido ? "opacity-60" : "",
            atrasada ? "border-red-200" : ""
        )}>
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
                tarefa.tipo === "chamada" ? "bg-emerald-400" :
                    tarefa.tipo === "reuniao" ? "bg-violet-400" :
                        tarefa.tipo === "prazo" ? "bg-orange-400" :
                            tarefa.tipo === "email" ? "bg-sky-400" :
                                tarefa.tipo === "almoco" ? "bg-amber-400" :
                                    "bg-blue-400"
            )} />
            <div className="pl-4 pr-3 py-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                            <Checkbox checked={concluido} className="transition-transform duration-200 data-[state=checked]:scale-110 flex-shrink-0" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                {getIconForType(tarefa.tipo)}
                                <p className={cn("font-semibold text-sm text-foreground leading-tight truncate", concluido && "line-through text-muted-foreground")}>
                                    {tarefa.titulo}
                                </p>
                            </div>
                            {tarefa.pessoa && <p className="text-xs text-blue-600 mt-0.5">{tarefa.pessoa}</p>}
                        </div>
                    </div>
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-8 z-20 bg-background border rounded-xl shadow-lg py-1 w-36">
                                    <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors" onClick={() => { setMenuOpen(false); onEditar(); }}>
                                        <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                                    </button>
                                    <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors" onClick={() => { setMenuOpen(false); onExcluir(); }}>
                                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(tarefa.status)}
                        {atrasada && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Atrasada</span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                        {tarefa.data_inicio ? new Date(tarefa.data_inicio).toLocaleDateString("pt-BR") : "—"}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────
export default function Tarefas() {
    const queryClient = useQueryClient()
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoFiltro>("all")
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
    const [modalAberto, setModalAberto] = useState(false)
    const [modalTipo, setModalTipo] = useState<"criar" | "editar">("criar")
    const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null)
    const [payload, setPayload] = useState<CreateTarefaPayload>(defaultPayload)
    const [selecionados, setSelecionados] = useState<string[]>([])
    const [tabAtiva, setTabAtiva] = useState<"pendentes" | "concluidos">("pendentes")

    const { data: tarefas = [], isLoading } = useQuery({
        queryKey: ['tarefas'],
        queryFn: () => tarefaService.getAll(),
        staleTime: 1000 * 60 * 5,
    })

    const { data: leads = [] } = useQuery({
        queryKey: ['leads'],
        queryFn: () => leadService.getAll(),
        staleTime: 1000 * 60 * 5,
    })

    function reload() { queryClient.invalidateQueries({ queryKey: ['tarefas'] }) }

    const concluidos = tarefas.filter(t => t.status === "CONCLUÍDA").length
    const pendentes = tarefas.filter(t => t.status !== "CONCLUÍDA").length
    const atrasados = tarefas.filter(t => t.status !== "CONCLUÍDA" && t.data_inicio && new Date(t.data_inicio) < new Date()).length

    const tarefasVisiveis = tarefas
        .filter(t => tabAtiva === "pendentes" ? t.status !== "CONCLUÍDA" : t.status === "CONCLUÍDA")
        .filter(t => tipoSelecionado === "all" || t.tipo === tipoSelecionado)

    const leadSelecionado = leads.find(l => l.id === payload.lead_id)

    function abrirModalCriar(tipo: TarefaTipo = "tarefa") {
        setModalTipo("criar")
        setTarefaEditando(null)
        setPayload({ ...defaultPayload, tipo })
        setModalAberto(true)
    }

    function abrirModalEditar(tarefa: Tarefa) {
        setModalTipo("editar")
        setTarefaEditando(tarefa)
        setPayload({
            lead_id: tarefa.lead_id ?? "",
            tipo: tarefa.tipo,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao ?? "",
            data_inicio: tarefa.data_inicio ? tarefa.data_inicio.split("T")[0] : "",
            data_fim: tarefa.data_fim ? tarefa.data_fim.split("T")[0] : "",
            status: tarefa.status,
            prioridade: tarefa.prioridade,
            pessoa: tarefa.pessoa ?? "",
            telefone: tarefa.telefone ?? "",
        })
        setModalAberto(true)
    }

    async function salvar() {
        if (!payload.titulo.trim()) return
        try {
            const body: CreateTarefaPayload = {
                ...payload,
                lead_id: payload.lead_id || undefined,
                pessoa: leadSelecionado?.name ?? payload.pessoa,
                telefone: leadSelecionado?.telefone ?? payload.telefone,
                data_inicio: payload.data_inicio || undefined,
                data_fim: payload.data_fim || undefined,
            }
            if (modalTipo === "editar" && tarefaEditando) {
                await tarefaService.update(tarefaEditando.id, body)
                toast.success("Atividade atualizada! ✅")
            } else {
                await tarefaService.create(body)
                toast.success("Atividade criada com sucesso!")
            }
            reload()
            setModalAberto(false)
            setPayload(defaultPayload)
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? "Erro ao salvar atividade")
        }
    }

    async function toggleConcluido(tarefa: Tarefa) {
        try {
            if (tarefa.status === "CONCLUÍDA") {
                await tarefaService.updateStatus(tarefa.id, "PENDENTE")
                toast.success("Tarefa reaberta")
            } else {
                await tarefaService.concluir(tarefa.id)
                toast.success("Tarefa concluída! ✅")
            }
            reload()
        } catch {
            toast.error("Erro ao atualizar status")
        }
    }

    const excluir = useCallback(async (id: string) => {
        try {
            await tarefaService.delete(id)
            toast.success("Atividade excluída!")
            queryClient.invalidateQueries({ queryKey: ['tarefas'] })
        } catch {
            toast.error("Erro ao excluir atividade")
        }
    }, [queryClient])

    async function excluirSelecionados() {
        try {
            await Promise.all(selecionados.map(id => tarefaService.delete(id)))
            toast.success(`${selecionados.length} atividade(s) excluída(s)!`)
            reload()
            setSelecionados([])
        } catch {
            toast.error("Erro ao excluir atividades")
        }
    }

    const toggleSelecionado = useCallback((id: string) => {
        setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }, [])

    return (
        <div className="min-h-screen bg-muted/40">
            <Sidebar />
            <main className="ml-0 md:ml-16 pb-24 md:pb-8">
                <div className="p-4 md:p-8 md:px-14 space-y-4">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Follow-ups</h2>
                            <p className="text-sm text-muted-foreground">{pendentes} pendentes</p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={() => abrirModalCriar("tarefa")}>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Novo Follow-up</span>
                            <span className="sm:hidden">Novo</span>
                        </Button>
                    </div>

                    {/* Stats — exatamente como no original: 2 cards lado a lado ocupando metade da tela */}
                    <div className="flex gap-3">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 w-64">
                            <p className="text-sm font-medium text-red-700">Atrasados</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{atrasados}</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 w-64">
                            <p className="text-sm font-medium text-green-700">Concluidos</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{concluidos}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-4 border-b">
                        <button onClick={() => setTabAtiva("pendentes")}
                            className={cn("pb-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                                tabAtiva === "pendentes" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground"
                            )}>
                            Pendentes ({pendentes})
                        </button>
                        <button onClick={() => setTabAtiva("concluidos")}
                            className={cn("pb-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                                tabAtiva === "concluidos" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground"
                            )}>
                            Concluidos ({concluidos})
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex border rounded-lg">
                                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="rounded-r-none" onClick={() => setViewMode("list")}>
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button variant={viewMode === "calendar" ? "secondary" : "ghost"} size="sm" className="rounded-l-none" onClick={() => setViewMode("calendar")}>
                                    <Calendar className="h-4 w-4" />
                                </Button>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                        <Plus className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">Atividade</span>
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => abrirModalCriar("chamada")}><Phone className="h-4 w-4 mr-2" /> Chamada</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("reuniao")}><Users className="h-4 w-4 mr-2" /> Reuniao</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("tarefa")}><CheckSquare className="h-4 w-4 mr-2" /> Tarefa</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("prazo")}><Flag className="h-4 w-4 mr-2" /> Prazo</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("email")}><Mail className="h-4 w-4 mr-2" /> E-mail</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("almoco")}><Coffee className="h-4 w-4 mr-2" /> Almoco</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                            {selecionados.length > 0 && (
                                <Button variant="destructive" size="sm" className="rounded-xl" onClick={excluirSelecionados}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Excluir ({selecionados.length})
                                </Button>
                            )}
                            <span className="text-sm text-muted-foreground hidden sm:inline">{tarefasVisiveis.length} atividades</span>
                            <Button variant="outline" size="sm" className="rounded-xl">
                                <Filter className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Filtro</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filtro por tipo */}
                    <div className="flex items-center border-b overflow-x-auto scrollbar-none">
                        <div className="flex gap-1 min-w-max">
                            {tiposAtividade.map((tipo) => (
                                <button key={tipo.id} onClick={() => setTipoSelecionado(tipo.id as TipoFiltro)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                                        tipoSelecionado === tipo.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}>
                                    {tipo.icon && <tipo.icon className="h-4 w-4" />}
                                    {tipo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile: Cards */}
                    <div className="md:hidden space-y-3">
                        {isLoading && [1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
                        {!isLoading && tarefasVisiveis.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <CheckSquare className="h-10 w-10 mb-3 opacity-40" />
                                <p className="font-medium">Nenhuma atividade encontrada</p>
                                <p className="text-sm mt-1">Adicione uma nova atividade</p>
                            </div>
                        )}
                        {!isLoading && tarefasVisiveis.map(t => (
                            <AtividadeCard key={t.id} tarefa={t}
                                onToggle={() => toggleConcluido(t)}
                                onEditar={() => abrirModalEditar(t)}
                                onExcluir={() => excluir(t.id)}
                            />
                        ))}
                    </div>

                    {/* Desktop: Tabela */}
                    <div className="hidden md:block border rounded-lg bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12" />
                                    <TableHead>Concluido</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Assunto</TableHead>
                                    <TableHead>Pessoa de contato</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data de venc.</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && (
                                    <TableRow><TableCell colSpan={9} className="text-center py-8 animate-pulse">Carregando...</TableCell></TableRow>
                                )}
                                {!isLoading && tarefasVisiveis.map(t => (
                                    <TableRow key={t.id} className="transition-all duration-300">
                                        <TableCell>
                                            <Checkbox checked={selecionados.includes(t.id)} onCheckedChange={() => toggleSelecionado(t.id)} />
                                        </TableCell>
                                        <TableCell>
                                            <Checkbox checked={t.status === "CONCLUÍDA"} onCheckedChange={() => toggleConcluido(t)} className="transition-transform duration-200 data-[state=checked]:scale-110" />
                                        </TableCell>
                                        <TableCell>{getIconForType(t.tipo)}</TableCell>
                                        <TableCell className="font-medium">{t.titulo}</TableCell>
                                        <TableCell><span className="text-blue-600">{t.pessoa || "—"}</span></TableCell>
                                        <TableCell>{t.telefone || "—"}</TableCell>
                                        <TableCell>{getStatusBadge(t.status)}</TableCell>
                                        <TableCell>{t.data_inicio ? new Date(t.data_inicio).toLocaleDateString("pt-BR") : "—"}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => abrirModalEditar(t)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => excluir(t.id)}>Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && tarefasVisiveis.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9}>
                                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                                <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
                                                <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
                                                <p className="text-sm">Tente ajustar os filtros ou adicione uma nova atividade</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>

            {/* Modal criar/editar */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {getIconForType(payload.tipo as TarefaTipo)}
                            {modalTipo === "criar" ? "Nova Atividade" : "Editar Atividade"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tipo de atividade</Label>
                            <Select value={payload.tipo} onValueChange={(v) => setPayload(p => ({ ...p, tipo: v as TarefaTipo }))}>
                                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chamada"><div className="flex items-center gap-2"><Phone className="h-4 w-4" /> Chamada</div></SelectItem>
                                    <SelectItem value="reuniao"><div className="flex items-center gap-2"><Users className="h-4 w-4" /> Reuniao</div></SelectItem>
                                    <SelectItem value="tarefa"><div className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tarefa</div></SelectItem>
                                    <SelectItem value="prazo"><div className="flex items-center gap-2"><Flag className="h-4 w-4" /> Prazo</div></SelectItem>
                                    <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-4 w-4" /> E-mail</div></SelectItem>
                                    <SelectItem value="almoco"><div className="flex items-center gap-2"><Coffee className="h-4 w-4" /> Almoco</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Assunto</Label>
                            <Input className="rounded-xl" value={payload.titulo} onChange={e => setPayload(p => ({ ...p, titulo: e.target.value }))} placeholder="Digite o titulo da atividade" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Lead</Label>
                                <Select value={payload.lead_id} onValueChange={v => setPayload(p => ({ ...p, lead_id: v }))}>
                                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o lead" /></SelectTrigger>
                                    <SelectContent>
                                        {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Contato</Label>
                                <Input className="rounded-xl bg-muted" value={leadSelecionado?.name ?? ""} readOnly placeholder="Selecione um lead" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Telefone</Label>
                                <Input className="rounded-xl bg-muted" value={leadSelecionado?.telefone ?? ""} readOnly placeholder="Telefone do lead" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={payload.status} onValueChange={v => setPayload(p => ({ ...p, status: v as TarefaStatus }))}>
                                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDENTE">🟡 PENDENTE</SelectItem>
                                        <SelectItem value="EM_ANDAMENTO">🔵 EM ANDAMENTO</SelectItem>
                                        <SelectItem value="CONCLUÍDA">🟢 CONCLUÍDA</SelectItem>
                                        <SelectItem value="CANCELADA">🔴 CANCELADA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Data de inicio</Label>
                            <Input className="rounded-xl" type="date" value={payload.data_inicio} onChange={e => setPayload(p => ({ ...p, data_inicio: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Hora inicio</Label>
                            <Input className="rounded-xl" type="time" value={payload.data_fim} onChange={e => setPayload(p => ({ ...p, data_fim: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Anotacoes</Label>
                            <Textarea className="rounded-xl" value={payload.descricao} onChange={e => setPayload(p => ({ ...p, descricao: e.target.value }))} placeholder="Adicione notas ou observacoes..." rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setModalAberto(false)}>Cancelar</Button>
                        <Button disabled={!payload.titulo.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={salvar}>
                            {modalTipo === "criar" ? "Criar atividade" : "Salvar alteracoes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}