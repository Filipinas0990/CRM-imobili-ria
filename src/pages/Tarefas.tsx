"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { toast } from "@/components/ui/use-toast";

import { Plus, List, Calendar, Phone, Users, CheckSquare, Flag, Mail, Coffee, Search, Filter, MoreHorizontal, ChevronDown, X, CalendarSearch as CalendarSync, Trash2, Edit, Clock } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TipoAtividade =
    | "all"
    | "chamada"
    | "reuniao"
    | "tarefa"
    | "prazo"
    | "email"
    | "almoco";


type Atividade = {
    id: string;
    lead_id: string;
    tipo: TipoAtividade;
    titulo: string;
    anotacoes: string | null;
    data_inicio: string;
    hora_inicio: string | null;
    hora_fim: string | null;
    concluido: boolean;



    // relação com leads
    leads?: {
        id: string;
        nome: string;
    };

}






const tiposAtividade = [
    { id: "all", label: "Tudo", icon: null },
    { id: "chamada", label: "Chamada", icon: Phone },
    { id: "reuniao", label: "Reunião", icon: Users },
    { id: "tarefa", label: "Tarefa", icon: CheckSquare },
    { id: "prazo", label: "Prazo", icon: Flag },
    { id: "email", label: "E-mail", icon: Mail },
    { id: "almoco", label: "Almoço", icon: Coffee },
];

const filtrosPeriodo = [
    { id: "para_fazer", label: "Para fazer" },
    { id: "vencido", label: "Vencido" },
    { id: "hoje", label: "Hoje" },
    { id: "amanha", label: "Amanhã" },
    { id: "esta_semana", label: "Esta semana" },
    { id: "proxima_semana", label: "Próxima semana" },
    { id: "selecionar", label: "Selecionar período" },
];

function getIconForType(tipo: TipoAtividade) {
    switch (tipo) {
        case "chamada":
            return <Phone className="h-4 w-4 text-emerald-600" />;
        case "reuniao":
            return <Users className="h-4 w-4 text-violet-600" />;
        case "tarefa":
            return <CheckSquare className="h-4 w-4 text-blue-600" />;
        case "prazo":
            return <Flag className="h-4 w-4 text-orange-600" />;
        case "email":
            return <Mail className="h-4 w-4 text-sky-600" />;
        case "almoco":
            return <Coffee className="h-4 w-4 text-amber-600" />;
        default:
            return null;
    }
}
type NovaAtividade = {
    lead_id: string;
    tipo: TipoAtividade;
    titulo: string;
    anotacoes: string;
    data_inicio: string;
    hora_inicio: string;
    hora_fim: string;
};

const defaultNovaAtividade: NovaAtividade = {
    lead_id: "",
    tipo: "tarefa",
    titulo: "",
    anotacoes: "",
    data_inicio: "",
    hora_inicio: "",
    hora_fim: "",
};



export default function Atividades() {

    const [tipoSelecionado, setTipoSelecionado] = useState<TipoAtividade>("all");

    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [showCalendarBanner, setShowCalendarBanner] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selecionados, setSelecionados] = useState<string[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [leadId, setLeadId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const busca = searchQuery;
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [userId, setUserId] = useState<string | null>(null);



    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
    }, []);

    const handleSelecionarTipo = (tipo: TipoAtividade) => {
        setTipoSelecionado(tipo);
    };








    // Modal 
    const [modalAberto, setModalAberto] = useState(false);
    const [modalTipo, setModalTipo] = useState<"criar" | "editar">("criar");
    const [atividadeEditando, setAtividadeEditando] = useState<Atividade | null>(null);
    const [novaAtividade, setNovaAtividade] = useState(defaultNovaAtividade);

    const atividadesFiltradas = atividades.filter((atividade) =>
        atividade.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        atividade.leads?.nome?.toLowerCase().includes(busca.toLowerCase())
    );


    // Stats 
    const atrasados = atividades.filter((a) => !a.concluido).length; // Simplified for demo

    const concluidos = atividades.filter((a) => a.concluido).length;
    const pendentes = atividades.filter((a) => !a.concluido).length;

    // Tab 
    const [tabAtiva, setTabAtiva] = useState<"pendentes" | "concluidos">("pendentes");






    async function carregarAtividades() {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("tarefas")
                .select(`
                    *,
                    leads (
                        id,
                        nome 
                        
                    )
                `)
                .order("data_inicio", { ascending: true });

            if (error) throw error;

            setAtividades(data ?? []);
        } catch {
            toast({
                title: "Erro",
                description: "Erro ao carregar atividades",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function carregarLeads() {
        const res: any = await getLeads();
        setLeads(res?.data ?? res ?? []);
    }

    useEffect(() => {
        carregarAtividades();
        carregarLeads();
    }, []);


    const atividadesVisiveis = atividades
        // filtro da TAB (pendentes / concluídos)
        .filter((a) => {
            if (tabAtiva === "pendentes") return !a.concluido;
            if (tabAtiva === "concluidos") return a.concluido;
            return true;
        })
        // filtro por TIPO
        .filter((a) => {
            if (tipoSelecionado === "all") return true;
            return a.tipo === tipoSelecionado;
        });

    /* =======================
       AÇÕES
    ======================= */

    const toggleConcluido = (id: string) => {
        setAtividades((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, concluido: !a.concluido } : a
            )
        );
    };

    const toggleSelecionado = (id: string) => {
        setSelecionados((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const toggleTodosSelecionados = () => {
        if (selecionados.length === atividades.length) {
            setSelecionados([]);
        } else {
            setSelecionados(atividades.map((a) => a.id));
        }
    };

    /* =======================
       MODAIS
    ======================= */

    const abrirModalCriar = (tipo: TipoAtividade = "tarefa") => {
        setModalTipo("criar");
        setNovaAtividade({ ...defaultNovaAtividade, tipo });
        setAtividadeEditando(null);
        setModalAberto(true);
    };

    const abrirModalEditar = (atividade: Atividade) => {
        setModalTipo("editar");
        setAtividadeEditando(atividade);

        setNovaAtividade({
            lead_id: atividade.lead_id ?? "",
            tipo: atividade.tipo, // agora o TS aceita
            titulo: atividade.titulo ?? "",
            anotacoes: atividade.anotacoes ?? "",
            data_inicio: atividade.data_inicio ?? "",
            hora_inicio: atividade.hora_inicio ?? "",
            hora_fim: atividade.hora_fim ?? "",
        });

        setModalAberto(true);
    };


    /* 
       SALVAR / EXCLUIRAtividade
*/


    const salvarAtividade = async () => {
        if (!novaAtividade.titulo.trim()) return;

        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("Usuário não autenticado");
            }


            const payload = {
                user_id: user.id, //
                lead_id: leadId || null,
                tipo: novaAtividade.tipo,
                titulo: novaAtividade.titulo,
                anotacoes: novaAtividade.anotacoes || null,

                data_inicio: novaAtividade.data_inicio
                    ? new Date(novaAtividade.data_inicio).toISOString()
                    : null,

                data_fim: novaAtividade.hora_fim
                    ? new Date(novaAtividade.hora_fim).toISOString()
                    : null,

                prioridade: "normal",
                status: "pendente",
            };


            if (modalTipo === "criar") {
                const { error } = await supabase
                    .from("tarefas")
                    .insert([payload]);

                if (error) throw error;
            }

            if (modalTipo === "editar" && atividadeEditando) {
                const { error } = await supabase
                    .from("tarefas")
                    .update(payload)
                    .eq("id", atividadeEditando.id);

                if (error) throw error;
            }

            toast({
                title: "Sucesso",
                description:
                    modalTipo === "criar"
                        ? "Atividade criada com sucesso"
                        : "Atividade atualizada com sucesso",
            });

            setModalAberto(false);
            setNovaAtividade(defaultNovaAtividade);
            setAtividadeEditando(null);
            setLeadId("");

            await carregarAtividades();
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Erro ao salvar",
                description: err.message || "Erro inesperado",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const excluirAtividade = (id: string) => {
        setAtividades((prev) => prev.filter((a) => a.id !== id));
        setSelecionados((prev) => prev.filter((i) => i !== id));
    };

    const excluirSelecionados = () => {
        setAtividades((prev) =>
            prev.filter((a) => !selecionados.includes(a.id))
        );
        setSelecionados([]);
    };

    return (
        <div className="min-h-screen bg-muted/40">
            <Sidebar />
            <main className="ml-16 p-8 space-y-6">

                <main className="px-6 py-4 space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Follow-ups</h2>
                                <p className="text-sm text-muted-foreground">{pendentes} pendentes</p>
                            </div>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => abrirModalCriar("tarefa")}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Follow-up
                            </Button>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {/* Atrasados Card */}
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors">
                                <p className="text-sm font-medium text-red-700">Atrasados</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{atrasados}</p>
                            </div>


                            {/* Concluidos Card */}
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors">
                                <p className="text-sm font-medium text-green-700">Concluidos</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{concluidos}</p>
                            </div>
                        </div>

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
                    </div>



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
                                        <Users className="h-4 w-4 mr-2" /> Reunião
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
                                        <Coffee className="h-4 w-4 mr-2" /> Almoço
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
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                SINCRONIZAÇÃO INATIVA
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
                                    <DropdownMenuItem onClick={() => abrirModalCriar("tarefa")}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nova atividade
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSelecionados(atividadesVisiveis.map(a => a.id))}>
                                        Selecionar todos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelecionados([])}>
                                        Limpar seleção
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>


                    <div className="flex items-center justify-between border-b">
                        <div className="flex gap-1">
                            {tiposAtividade.map((tipo) => (
                                <button
                                    key={tipo.id}
                                    onClick={() => setTipoSelecionado(tipo.id as TipoAtividade)}
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


                    <div className="border rounded-lg bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selecionados.length === atividadesVisiveis.length && atividadesVisiveis.length > 0}
                                            onCheckedChange={toggleTodosSelecionados}
                                        />
                                    </TableHead>
                                    <TableHead className="w-20">Concluído</TableHead>
                                    <TableHead className="min-w-[200px]">Assunto</TableHead>
                                    <TableHead>Negócio</TableHead>
                                    <TableHead>Prioridade</TableHead>
                                    <TableHead>Pessoa de contato</TableHead>

                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Organização</TableHead>
                                    <TableHead>Data de venc.</TableHead>
                                    <TableHead>Duração</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {atividadesVisiveis.map((atividade) => (
                                    <TableRow
                                        key={atividade.id}
                                        className={cn(
                                            "group cursor-pointer hover:bg-muted/50",
                                            atividade.concluido && "opacity-50 bg-muted/20",
                                            selecionados.includes(atividade.id) && "bg-blue-50"
                                        )}
                                        onDoubleClick={() => abrirModalEditar(atividade)}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selecionados.includes(atividade.id)}
                                                onCheckedChange={() => toggleSelecionado(atividade.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => toggleConcluido(atividade.id)}
                                                className={cn(
                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    atividade.concluido
                                                        ? "bg-emerald-600 border-emerald-600"
                                                        : "border-muted-foreground/40 hover:border-emerald-600"
                                                )}
                                            >
                                                {atividade.concluido && (
                                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getIconForType(atividade.tipo)}
                                                <span className={cn(
                                                    "text-blue-600 hover:underline cursor-pointer",
                                                    atividade.concluido && "line-through"
                                                )}>
                                                    {atividade.titulo}
                                                </span>
                                            </div>
                                        </TableCell>


                                        <TableCell>
                                            <span className="text-blue-600 hover:underline cursor-pointer">
                                                {atividade.leads?.nome || "—"}
                                            </span>
                                        </TableCell>



                                        <TableCell className="text-muted-foreground">
                                            {atividade.data_inicio}
                                        </TableCell>
                                        <TableCell>{atividade.hora_inicio || ""}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => abrirModalEditar(atividade)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleConcluido(atividade.id)}>
                                                        <CheckSquare className="h-4 w-4 mr-2" />
                                                        {atividade.concluido ? "Reabrir" : "Concluir"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => excluirAtividade(atividade.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
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
                                <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
                                <p className="text-sm">Tente ajustar os filtros ou adicione uma nova atividade</p>
                            </div>
                        )}
                    </div>
                </main>
            </main>


            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {getIconForType(novaAtividade.tipo)}
                            {modalTipo === "criar" ? "Nova Atividade" : "Editar Atividade"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="tipo">Tipo de atividade</Label>
                            <Select
                                value={novaAtividade.tipo}
                                onValueChange={(value) =>
                                    setNovaAtividade({ ...novaAtividade, tipo: value as TipoAtividade })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chamada">
                                        <button onClick={() => handleSelecionarTipo("chamada")}>
                                            Chamada
                                        </button>
                                    </SelectItem>
                                    <SelectItem value="reuniao">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Reunião
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
                                            <Coffee className="h-4 w-4" /> Almoço
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="assunto">Assunto</Label>
                            <Input
                                id="assunto"
                                value={novaAtividade.titulo}
                                onChange={(e) =>
                                    setNovaAtividade({ ...novaAtividade, titulo: e.target.value })
                                }
                                placeholder="Digite o título da atividade"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">


                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pessoa_contato">LEAD</Label>
                                <Select value={leadId} onValueChange={(value) => setLeadId(value)}>
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

                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="grid gap-2">
                                <Label htmlFor="prioridade">Prioridade</Label>

                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div className="grid gap-2">
                                <Label htmlFor="duracao">Duração</Label>

                            </div>

                        </div>
                        <Input
                            type="date"
                            value={novaAtividade.data_inicio}
                            onChange={(e) =>
                                setNovaAtividade({ ...novaAtividade, data_inicio: e.target.value })
                            }
                        />


                        <div className="grid gap-2">
                            <Label htmlFor="notas">anotacoes</Label>
                            <Textarea
                                id="notas"
                                value={novaAtividade.anotacoes}
                                onChange={(e) =>
                                    setNovaAtividade({ ...novaAtividade, anotacoes: e.target.value })
                                }
                                placeholder="Adicione notas ou observações..."
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
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {modalTipo === "criar" ? "Criar atividade" : "Salvar alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
