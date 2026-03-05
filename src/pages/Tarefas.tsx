import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Plus,
    List,
    Calendar,
    Phone,
    Users,
    CheckSquare,
    Flag,
    Mail,
    Coffee,
    Filter,
    MoreHorizontal,
    ChevronDown,
    Trash2,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/* =====================
   TIPOS
===================== */

type Lead = {
    id: string
    nome: string
    telefone: string

}

type TipoAtividade =
    | "all"
    | "chamada"
    | "reuniao"
    | "tarefa"
    | "prazo"
    | "email"
    | "almoco"

type Atividade = {
    id: string
    user_id: string
    lead_id: string
    tipo: TipoAtividade
    titulo: string
    anotacoes: string | null
    data_inicio: string
    hora_inicio: string | null

    prioridade: string
    status: string
    concluido: boolean
    leads?: Lead | null
}

/* =====================
   DADOS INICIAIS
===================== */


const initialAtividades: Atividade[] = [
    {
        id: "a1", user_id: "u1", lead_id: "1", tipo: "chamada",
        titulo: "Ligar para confirmar visita",
        anotacoes: "Cliente quer visitar apartamento no centro",
        data_inicio: "2026-02-10T10:00:00.000Z", hora_inicio: "10:00",
        prioridade: "alta", status: "PENDENTE", concluido: false,
        leads: { id: "1", nome: "Maria Silva", telefone: "(11) 99999-1234" },
    },
    {
        id: "a2", user_id: "u1", lead_id: "2", tipo: "reuniao",
        titulo: "Apresentacao do empreendimento",
        anotacoes: "Preparar material de vendas",
        data_inicio: "2026-02-12T14:00:00.000Z", hora_inicio: "14:00",

        prioridade: "normal", status: "PENDENTE", concluido: false,
        leads: { id: "2", nome: "Joao Santos", telefone: "(21) 98888-5678" },
    },
    {
        id: "a3", user_id: "u1", lead_id: "3", tipo: "email",
        titulo: "Enviar proposta comercial", anotacoes: null,
        data_inicio: "2026-02-08T09:00:00.000Z", hora_inicio: "09:00",
        prioridade: "alta", status: "PENDENTE", concluido: true,
        leads: { id: "3", nome: "Ana Costa", telefone: "(31) 97777-9012" },
    },
    {
        id: "a4", user_id: "u1", lead_id: "4", tipo: "tarefa",
        titulo: "Atualizar documentacao do imovel",
        anotacoes: "Verificar certidoes atualizadas",
        data_inicio: "2026-02-15T08:00:00.000Z", hora_inicio: "08:00",
        prioridade: "normal", status: "PENDENTE", concluido: false,
        leads: { id: "4", nome: "Pedro Oliveira", telefone: "(41) 96666-3456" },
    },
    {
        id: "a5", user_id: "u1", lead_id: "5", tipo: "almoco",
        titulo: "Almoco com investidor", anotacoes: "Restaurante no centro",
        data_inicio: "2026-02-14T12:00:00.000Z", hora_inicio: "12:00",
        prioridade: "baixa", status: "PENDENTE", concluido: false,
        leads: { id: "5", nome: "Lucia Ferreira", telefone: "(51) 95555-7890" },
    },
    {
        id: "a6", user_id: "u1", lead_id: "1", tipo: "prazo",
        titulo: "Prazo para entrega de contrato",
        anotacoes: "Contrato precisa ser assinado",
        data_inicio: "2026-02-07T00:00:00.000Z", hora_inicio: null,
        prioridade: "alta", status: "PENDENTE", concluido: true,
        leads: { id: "1", nome: "Maria Silva", telefone: "(11) 99999-1234" },
    },
]

/* =====================
   CONSTANTES
===================== */

const tiposAtividade = [
    { id: "all", label: "Tudo", icon: null },
    { id: "chamada", label: "Chamada", icon: Phone },
    { id: "reuniao", label: "Reuniao", icon: Users },
    { id: "tarefa", label: "Tarefa", icon: CheckSquare },
    { id: "prazo", label: "Prazo", icon: Flag },
    { id: "email", label: "E-mail", icon: Mail },
    { id: "almoco", label: "Almoco", icon: Coffee },
]

function getIconForType(tipo: TipoAtividade) {
    switch (tipo) {
        case "chamada":
            return <Phone className="h-4 w-4 text-emerald-600" />
        case "reuniao":
            return <Users className="h-4 w-4 text-violet-600" />
        case "tarefa":
            return <CheckSquare className="h-4 w-4 text-blue-600" />
        case "prazo":
            return <Flag className="h-4 w-4 text-orange-600" />
        case "email":
            return <Mail className="h-4 w-4 text-sky-600" />
        case "almoco":
            return <Coffee className="h-4 w-4 text-amber-600" />
        default:
            return null
    }
}

/* =====================
   TIPO PARA FORMULARIO
===================== */

type NovaAtividade = {
    lead_id: string
    tipo: TipoAtividade
    titulo: string
    anotacoes: string
    data_inicio: string
    hora_inicio: string
    hora_fim: string,

}

const defaultNovaAtividade: NovaAtividade = {
    lead_id: "",
    tipo: "tarefa",
    titulo: "",
    anotacoes: "",
    data_inicio: "",
    hora_inicio: "",
    hora_fim: "",

}

/* =====================
   COMPONENTE PRINCIPAL
===================== */

export default function Atividades() {
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoAtividade>("all")
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

    const [leads, setLeads] = useState<Lead[]>([])



    /* ----- Modal state ----- */
    const [modalAberto, setModalAberto] = useState(false)
    const [modalTipo, setModalTipo] = useState<"criar" | "editar">("criar")
    const [atividadeEditando, setAtividadeEditando] = useState<Atividade | null>(null)
    const [novaAtividade, setNovaAtividade] = useState<NovaAtividade>(defaultNovaAtividade)
    const [atividades, setAtividades] = useState<Atividade[]>([])
    const [selecionados, setSelecionados] = useState<string[]>([])
    const [status, setStatus] = useState("PENDENTE")


    /* ----- Tab state ----- */
    const [tabAtiva, setTabAtiva] = useState<"pendentes" | "concluidos">("pendentes")

    /* 
       CARREGAR DADOS 
    */
    async function carregarTarefas() {
        const { data, error } = await supabase
            .from("tarefas")
            .select("*")
            .order("data_inicio", { ascending: true })


        if (error) return

        const tarefasFormatadas = data.map((t) => ({
            id: t.id,
            user_id: t.user_id,
            lead_id: t.lead_id,
            tipo: t.tipo,
            titulo: t.titulo,
            anotacoes: t.descricao,
            data_inicio: t.data_inicio,
            hora_inicio: t.data_inicio
                ? new Date(t.data_inicio).toISOString().slice(11, 16)
                : null,
            hora_fim: t.data_fim
                ? new Date(t.data_fim).toISOString().slice(11, 16)
                : null,
            prioridade: t.prioridade,
            status: t.status,
            concluido: t.status === "CONCLUÍDA",
            leads: {
                id: t.lead_id,
                nome: t.pessoa,
                telefone: t.telefone,

            },
        }))

        setAtividades(tarefasFormatadas)
    }

    useEffect(() => {
        carregarTarefas()
    }, [])


    /* CAREEGAR LEADS*/
    async function carregarLeads() {
        const { data, error } = await supabase


            .from("leads")
            .select("id, nome, telefone")
        console.log("LEADS:", data)


        if (error) {
            console.error(error)
            return
        }

        setLeads(data || [])
    }

    useEffect(() => {
        carregarTarefas()
        carregarLeads()
    }, [])












    // FIX 1: atividadesVisiveis aplica filtros de tab + tipo
    const atividadesVisiveis = atividades
        .filter((a) => {
            if (tabAtiva === "pendentes") return !a.concluido
            if (tabAtiva === "concluidos") return a.concluido
            return true
        })
        .filter((a) => {
            if (tipoSelecionado === "all") return true
            return a.tipo === tipoSelecionado
        })

    /* ----- Stats ----- */
    const concluidos = atividades.filter((a) => a.concluido).length
    const pendentes = atividades.filter((a) => !a.concluido).length
    const atrasados = atividades.filter(
        (a) => !a.concluido && new Date(a.data_inicio) < new Date()
    ).length

    /* 
       AUTO-PREENCHIMENTO DO LEAD*/

    // FIX 4: leadSelecionado derivado de novaAtividade.lead_id (sem estado duplicado leadId)
    const leadSelecionado = leads.find(
        (l) => String(l.id) === novaAtividade.lead_id
    )

    /* 
       ACOES */

    const toggleConcluido = async (atividade: Atividade) => {
        const novoStatus =
            atividade.status === "CONCLUÍDA"
                ? "PENDENTE"
                : "CONCLUÍDA"

        // 1️⃣ Atualiza imediatamente na tela
        setAtividades((prev) =>
            prev.map((a) =>
                a.id === atividade.id
                    ? { ...a, status: novoStatus, concluido: novoStatus === "CONCLUÍDA" }
                    : a
            )
        )

        // 2️⃣ Atualiza no banco
        const { error } = await supabase
            .from("tarefas")
            .update({ status: novoStatus })
            .eq("id", atividade.id)

        // 3️⃣ Se der erro, desfaz
        if (error) {
            console.error(error)

            setAtividades((prev) =>
                prev.map((a) =>
                    a.id === atividade.id
                        ? { ...a, status: atividade.status, concluido: atividade.concluido }
                        : a
                )
            )
        }
    }


    const toggleSelecionado = useCallback((id: string) => {
        setSelecionados((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }, [])

    /*MODAIS */

    const abrirModalCriar = (tipo: TipoAtividade = "tarefa") => {
        setModalTipo("criar")
        setNovaAtividade({ ...defaultNovaAtividade, tipo })
        setAtividadeEditando(null)
        setModalAberto(true)
    }

    const abrirModalEditar = (atividade: Atividade) => {
        setModalTipo("editar")
        setAtividadeEditando(atividade)
        // 
        setNovaAtividade({
            lead_id: atividade.lead_id ?? "",
            tipo: atividade.tipo,
            titulo: atividade.titulo ?? "",
            anotacoes: atividade.anotacoes ?? "",
            data_inicio: atividade.data_inicio
                ? atividade.data_inicio.split("T")[0]
                : "",
            hora_inicio: atividade.hora_inicio ?? "",
            hora_fim: atividade.hora_fim ?? "",

        })
        setModalAberto(true)
    }

    /* 
       SALVAR / EXCLUIR
     */



    const salvarAtividade = async () => {
        if (!novaAtividade.titulo.trim()) return

        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase
            .from("tarefas")
            .insert([
                {
                    user_id: user.id,
                    lead_id: novaAtividade.lead_id || null,
                    tipo: novaAtividade.tipo,
                    titulo: novaAtividade.titulo,
                    descricao: novaAtividade.anotacoes || null,
                    data_inicio: novaAtividade.data_inicio
                        ? new Date(novaAtividade.data_inicio).toISOString()
                        : null,
                    data_fim: novaAtividade.hora_fim
                        ? new Date(
                            novaAtividade.data_inicio + "T" + novaAtividade.hora_fim
                        ).toISOString()
                        : null,
                    prioridade: "normal",
                    status: status,
                    pessoa: leadSelecionado?.nome || null,
                    telefone: leadSelecionado?.telefone || null,

                }
            ])

        if (error) {
            console.error(error)
            return
        }

        await carregarTarefas()

        setModalAberto(false)
        setNovaAtividade(defaultNovaAtividade)
        setStatus("PENDENTE")

    }

    const excluirAtividade = useCallback(async (id: string) => {
        const { error } = await supabase
            .from("tarefas")
            .delete()
            .eq("id", id)

        if (error) {
            console.error(error)
            return
        }

        await carregarTarefas()
    }, [])

    const excluirSelecionados = async () => {
        if (selecionados.length === 0) return

        const { error } = await supabase
            .from("tarefas")
            .delete()
            .in("id", selecionados)

        if (error) {
            console.error(error)
            return
        }

        await carregarTarefas()
        setSelecionados([])
    }




    /* 
       RENDER*/

    return (
        <div className="min-h-screen bg-muted/40">
            <Sidebar />
            <main className="ml-16 p-8">
                <div className="px-6 py-4 space-y-4">
                    {/*  */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground text-balance">
                                Follow-ups
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {pendentes} pendentes
                            </p>
                        </div>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => abrirModalCriar("tarefa")}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Follow-up
                        </Button>
                    </div>

                    {/*  */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors">
                            <p className="text-sm font-medium text-red-700">Atrasados</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">
                                {atrasados}
                            </p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors">
                            <p className="text-sm font-medium text-green-700">Concluidos</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {concluidos}
                            </p>
                        </div>
                    </div>

                    {/*  */}
                    <div className="flex items-center gap-4 border-b">
                        <button
                            onClick={() => setTabAtiva("pendentes")}
                            className={cn(
                                "pb-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                                tabAtiva === "pendentes"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Pendentes ({pendentes})
                        </button>
                        <button
                            onClick={() => setTabAtiva("concluidos")}
                            className={cn(
                                "pb-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                                tabAtiva === "concluidos"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Concluidos ({concluidos})
                        </button>
                    </div>

                    {/**/}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex border rounded-md">
                                <Button
                                    variant={viewMode === "list" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="rounded-r-none"
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "calendar" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="rounded-l-none"
                                    onClick={() => setViewMode("calendar")}
                                >
                                    <Calendar className="h-4 w-4" />
                                </Button>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Atividade
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => abrirModalCriar("chamada")}>
                                        <Phone className="h-4 w-4 mr-2" /> Chamada
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("reuniao")}>
                                        <Users className="h-4 w-4 mr-2" /> Reuniao
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("tarefa")}>
                                        <CheckSquare className="h-4 w-4 mr-2" /> Tarefa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("prazo")}>
                                        <Flag className="h-4 w-4 mr-2" /> Prazo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("email")}>
                                        <Mail className="h-4 w-4 mr-2" /> E-mail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => abrirModalCriar("almoco")}>
                                        <Coffee className="h-4 w-4 mr-2" /> Almoco
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-3">
                            {selecionados.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={excluirSelecionados}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Excluir ({selecionados.length})
                                </Button>
                            )}
                            <span className="text-sm text-muted-foreground">
                                {atividadesVisiveis.length} atividades
                            </span>
                            <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300 bg-amber-50"
                            >
                                DEMO MODE
                            </Badge>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-1" />
                                Filtro
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => abrirModalCriar("tarefa")}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nova atividade
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setSelecionados(atividadesVisiveis.map((a) => a.id))
                                        }
                                    >
                                        Selecionar todos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelecionados([])}>
                                        Limpar selecao
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/*  */}
                    <div className="flex items-center justify-between border-b">
                        <div className="flex gap-1">
                            {tiposAtividade.map((tipo) => (
                                <button
                                    key={tipo.id}
                                    onClick={() =>
                                        setTipoSelecionado(tipo.id as TipoAtividade)
                                    }
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                                        tipoSelecionado === tipo.id
                                            ? "border-foreground text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tipo.icon && <tipo.icon className="h-4 w-4" />}
                                    {tipo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/*  */}
                    <div className="border rounded-lg bg-background">
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
                                {/* */}
                                {atividadesVisiveis.map((atividade) => (
                                    <TableRow key={atividade.id} className="transition-all duration-300">
                                        <TableCell>
                                            <Checkbox
                                                checked={selecionados.includes(atividade.id)}
                                                onCheckedChange={() =>
                                                    toggleSelecionado(atividade.id)
                                                }
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Checkbox
                                                checked={atividade.status === "CONCLUÍDA"}
                                                onCheckedChange={() => toggleConcluido(atividade)}
                                                className="transition-transform duration-200 data-[state=checked]:scale-110"
                                            />

                                        </TableCell>

                                        <TableCell>{getIconForType(atividade.tipo)}</TableCell>

                                        <TableCell className="font-medium">
                                            {atividade.titulo}
                                        </TableCell>

                                        {/*  */}
                                        <TableCell>
                                            <span className="text-blue-600">
                                                {atividade.leads?.nome || "\u2014"}
                                            </span>
                                        </TableCell>

                                        {/*  */}
                                        <TableCell>
                                            {atividade.leads?.telefone || "\u2014"}
                                        </TableCell>

                                        {/*  */}

                                        <TableCell>
                                            {atividade.status === "PENDENTE" && (
                                                <Badge className="bg-yellow-100 text-yellow-800">
                                                    Pendente
                                                </Badge>
                                            )}

                                            {atividade.status === "EM ANDAMENTO" && (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    Em andamento
                                                </Badge>
                                            )}

                                            {atividade.status === "CONCLUÍDA" && (
                                                <Badge className="bg-green-100 text-green-800">
                                                    Concluída
                                                </Badge>
                                            )}

                                            {atividade.status === "CANCELADA" && (
                                                <Badge className="bg-red-100 text-red-800">
                                                    Cancelada
                                                </Badge>
                                            )}
                                        </TableCell>


                                        <TableCell>
                                            {new Date(atividade.data_inicio).toLocaleDateString(
                                                "pt-BR"
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => abrirModalEditar(atividade)}
                                                    >
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => excluirAtividade(atividade.id)}
                                                    >
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {atividadesVisiveis.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium">
                                    Nenhuma atividade encontrada
                                </p>
                                <p className="text-sm">
                                    Tente ajustar os filtros ou adicione uma nova atividade
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 
          MODAL CRIAR / EDITAR*/}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {getIconForType(novaAtividade.tipo)}
                            {modalTipo === "criar"
                                ? "Nova Atividade"
                                : "Editar Atividade"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* */}
                        <div className="grid gap-2">
                            <Label htmlFor="tipo">Tipo de atividade</Label>
                            <Select
                                value={novaAtividade.tipo}
                                onValueChange={(value) =>
                                    setNovaAtividade({
                                        ...novaAtividade,
                                        tipo: value as TipoAtividade,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chamada">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> Chamada
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="reuniao">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Reuniao
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="tarefa">
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="h-4 w-4" /> Tarefa
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="prazo">
                                        <div className="flex items-center gap-2">
                                            <Flag className="h-4 w-4" /> Prazo
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="email">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" /> E-mail
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="almoco">
                                        <div className="flex items-center gap-2">
                                            <Coffee className="h-4 w-4" /> Almoco
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assunto */}
                        <div className="grid gap-2">
                            <Label htmlFor="assunto">Assunto</Label>
                            <Input
                                id="assunto"
                                value={novaAtividade.titulo}
                                onChange={(e) =>
                                    setNovaAtividade({
                                        ...novaAtividade,
                                        titulo: e.target.value,
                                    })
                                }
                                placeholder="Digite o titulo da atividade"
                            />
                        </div>

                        {/* */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Lead</Label>
                                <Select
                                    value={novaAtividade.lead_id}
                                    onValueChange={(value) =>
                                        setNovaAtividade({
                                            ...novaAtividade,
                                            lead_id: value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leads.map((l) => (
                                            <SelectItem key={l.id} value={String(l.id)}>
                                                {l.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/*  */}
                            <div className="grid gap-2">
                                <Label>Pessoa de contato</Label>
                                <Input
                                    value={leadSelecionado?.nome ?? ""}
                                    readOnly
                                    className="bg-muted"
                                    placeholder="Selecione um lead"
                                />
                            </div>
                        </div>

                        {/* */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Telefone</Label>
                                <Input
                                    value={leadSelecionado?.telefone ?? ""}
                                    readOnly
                                    className="bg-muted"
                                    placeholder="Telefone do lead"
                                />
                            </div>
                            {<div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDENTE">🟡 PENDENTE</SelectItem>
                                        <SelectItem value="EM ANDAMENTO">🔵 EM ANDAMENTO</SelectItem>
                                        <SelectItem value="CONCLUÍDA">🟢 CONCLUÍDA</SelectItem>
                                        <SelectItem value="CANCELADA">🔴 CANCELADA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>



                        /* Data */}
                        </div>
                        <div className="grid gap-2">
                            <Label>Data de inicio</Label>
                            <Input
                                type="date"
                                value={novaAtividade.data_inicio}
                                onChange={(e) =>
                                    setNovaAtividade({
                                        ...novaAtividade,
                                        data_inicio: e.target.value,
                                    })
                                }
                            />
                        </div>

                        {/* Horarios */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Hora inicio</Label>
                                <Input
                                    type="time"
                                    value={novaAtividade.hora_inicio}
                                    onChange={(e) =>
                                        setNovaAtividade({
                                            ...novaAtividade,
                                            hora_inicio: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            {/*  <div className="grid gap-2">
                                <Label>Hora fim</Label>
                                <Input
                                    type="time"
                                    value={novaAtividade.hora_fim}
                                    onChange={(e) =>
                                        setNovaAtividade({
                                            ...novaAtividade,
                                            hora_fim: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            */}

                        </div>

                        {/* Anotacoes */}
                        <div className="grid gap-2">
                            <Label htmlFor="notas">Anotacoes</Label>
                            <Textarea
                                id="notas"
                                value={novaAtividade.anotacoes}
                                onChange={(e) =>
                                    setNovaAtividade({
                                        ...novaAtividade,
                                        anotacoes: e.target.value,
                                    })
                                }
                                placeholder="Adicione notas ou observacoes..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalAberto(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={salvarAtividade}
                            disabled={!novaAtividade.titulo.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {modalTipo === "criar"
                                ? "Criar atividade"
                                : "Salvar alteracoes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
