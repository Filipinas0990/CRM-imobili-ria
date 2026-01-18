import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, isBefore, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import clsx from "clsx";


type Atividade = {
    id: string;
    titulo: string;
    descricao: string | null;
    tipo: string;
    prioridade: string;
    status: string;
    data_inicio: string;
    data_fim: string | null;
    concluido: boolean | null;
    lead_id?: string | null;

    // relação com leads
    leads?: {
        id: string;
        nome: string;
    };
};

export default function Tarefas() {
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [loading, setLoading] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState<"pendentes" | "concluidas">("pendentes");

    const [openModal, setOpenModal] = useState(false);

    const [tipo, setTipo] = useState("chamada");
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [prioridade, setPrioridade] = useState("normal");

    const [leads, setLeads] = useState<any[]>([]);
    const [leadId, setLeadId] = useState<string>("");


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

            setAtividades(data || []);
        } catch {
            toast.error("Erro ao carregar atividades");
        } finally {
            setLoading(false);
        }
    }

    async function carregarLeads() {
        const res: any = await getLeads();
        setLeads(res?.data || res || []);
    }

    useEffect(() => {
        carregarAtividades();
        carregarLeads();
    }, []);

    async function criarAtividade() {
        if (!titulo.trim()) {
            toast.error("Informe o título da tarefa");
            return;
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            toast.error("Usuário não autenticado");
            return;
        }

        const dataInicioISO =
            dataInicio && horaInicio
                ? new Date(`${dataInicio}T${horaInicio}`).toISOString()
                : new Date().toISOString();

        const dataFimISO =
            dataInicio && horaFim
                ? new Date(`${dataInicio}T${horaFim}`).toISOString()
                : null;

        const { error } = await supabase.from("tarefas").insert({
            titulo: titulo.trim(),
            descricao,
            tipo,
            prioridade,
            status: "pendente",
            data_inicio: dataInicioISO,
            data_fim: dataFimISO,
            user_id: user.id,
            lead_id: leadId || null,
        });

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Follow-up criado!");
        setOpenModal(false);
        setTitulo("");
        setDescricao("");
        carregarAtividades();
    }

    async function toggleStatus(atividade: Atividade) {
        const novoStatus =
            atividade.status === "concluida" ? "pendente" : "concluida";

        const { error } = await supabase
            .from("tarefas")
            .update({ status: novoStatus })
            .eq("id", atividade.id);

        if (error) {
            toast.error("Erro ao atualizar status");
            return;
        }

        setAtividades((prev) =>
            prev.map((a) =>
                a.id === atividade.id ? { ...a, status: novoStatus } : a
            )
        );
    }

    const pendentes = atividades.filter((a) => a.status === "pendente");
    const concluidas = atividades.filter((a) => a.status === "concluida");

    const atrasados = pendentes.filter(
        (a) =>
            isBefore(new Date(a.data_inicio), new Date()) &&
            !isToday(new Date(a.data_inicio))
    );

    const hoje = pendentes.filter((a) => isToday(new Date(a.data_inicio)));
    const amanha = pendentes.filter((a) => isTomorrow(new Date(a.data_inicio)));

    return (
        <div className="min-h-screen flex bg-muted/40">
            <Sidebar />

            <div className="flex-1 ml-20">
                <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

                    {/* HEADER */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Follow-ups</h1>
                            <p className="text-sm text-muted-foreground">
                                {pendentes.length} pendentes
                            </p>
                        </div>

                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => setOpenModal(true)}
                        >
                            <Plus size={16} className="mr-2" />
                            Novo Follow-up
                        </Button>
                    </div>

                    {/* RESUMO */}
                    <div className="grid grid-cols-4 gap-4">
                        <ResumoCard titulo="Atrasados" valor={atrasados.length} cor="red" />
                        <ResumoCard titulo="Para hoje" valor={hoje.length} cor="yellow" />
                        <ResumoCard titulo="Amanhã" valor={amanha.length} cor="blue" />
                        <ResumoCard titulo="Concluídos" valor={concluidas.length} cor="green" />
                    </div>

                    {/* TABS */}
                    <div className="flex gap-4 border-b">
                        <button
                            onClick={() => setAbaAtiva("pendentes")}
                            className={clsx(
                                "pb-2 font-medium",
                                abaAtiva === "pendentes"
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-muted-foreground"
                            )}
                        >
                            Pendentes ({pendentes.length})
                        </button>

                        <button
                            onClick={() => setAbaAtiva("concluidas")}
                            className={clsx(
                                "pb-2 font-medium",
                                abaAtiva === "concluidas"
                                    ? "border-b-2 border-green-600 text-green-600"
                                    : "text-muted-foreground"
                            )}
                        >
                            Concluídos ({concluidas.length})
                        </button>
                    </div>

                    {/* LISTA */}
                    <div className="space-y-3">
                        {loading && <p className="text-center py-10">Carregando...</p>}

                        {!loading &&
                            (abaAtiva === "pendentes" ? pendentes : concluidas).map(
                                (atividade) => {
                                    const atrasado =
                                        atividade.status === "pendente" &&
                                        isBefore(new Date(atividade.data_inicio), new Date()) &&
                                        !isToday(new Date(atividade.data_inicio));

                                    return (
                                        <div
                                            key={atividade.id}
                                            className={clsx(
                                                "border rounded-xl p-4 flex gap-3 items-start transition",
                                                atrasado
                                                    ? "bg-red-50 border-red-200"
                                                    : atividade.status === "concluida"
                                                        ? "bg-muted/40 opacity-70"
                                                        : "bg-white"
                                            )}
                                        >
                                            <Checkbox
                                                checked={atividade.status === "concluida"}
                                                onCheckedChange={() => toggleStatus(atividade)}
                                            />

                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {atividade.titulo}
                                                </p>

                                                {atividade.leads?.nome && (
                                                    <p className="text-sm text-blue-600 font-medium mt-1">
                                                        👤 {atividade.leads.nome}
                                                    </p>
                                                )}


                                                <p className="text-sm text-muted-foreground">
                                                    {atividade.descricao || "Sem descrição"}
                                                </p>

                                                <div
                                                    className={clsx(
                                                        "flex items-center gap-2 text-xs mt-2",
                                                        atrasado ? "text-red-600" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <Clock size={14} />
                                                    {format(
                                                        new Date(atividade.data_inicio),
                                                        "dd 'de' MMM 'às' HH:mm",
                                                        { locale: ptBR }
                                                    )}
                                                    {atrasado && <span>(Atrasado)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            )}

                        {!loading &&
                            (abaAtiva === "pendentes" ? pendentes : concluidas).length === 0 && (
                                <p className="text-center py-10 text-muted-foreground">
                                    Nenhum follow-up encontrado
                                </p>
                            )}
                    </div>
                </main>
            </div>

            {/* MODAL */}
            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Novo Follow-up</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Lead</Label>

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
                            <div className="space-y-2">
                                <Label>Tipo</Label>

                                <Select value={tipo} onValueChange={setTipo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" className="a" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="chamada">📞 Chamada</SelectItem>
                                        <SelectItem value="reuniao">📅 Reunião</SelectItem>
                                        <SelectItem value="tarefa">📝 Tarefa</SelectItem>
                                        <SelectItem value="followup_almoco">🍽️ Follow-up Almoço</SelectItem>
                                        <SelectItem value="anotacao">📌 Anotação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Título</Label>
                                <Input
                                    placeholder="Ex: Ligar para o cliente"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                />
                            </div>



                            <div>
                                <Label>Anotações</Label>
                                <Textarea
                                    placeholder="Observações sobre essa atividade"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                />
                                <Input
                                    type="time"
                                    value={horaInicio}
                                    onChange={(e) => setHoraInicio(e.target.value)}
                                />
                                <Input
                                    type="time"
                                    value={horaFim}
                                    onChange={(e) => setHoraFim(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="border rounded-lg flex items-center justify-center text-muted-foreground">
                            Calendário (visual)
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={criarAtividade}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* CARD RESUMO */
function ResumoCard({
    titulo,
    valor,
    cor,
}: {
    titulo: string;
    valor: number;
    cor: "red" | "yellow" | "blue" | "green";
}) {
    const cores = {
        red: "bg-red-50 border-red-200 text-red-700",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        green: "bg-green-50 border-green-200 text-green-700",
    };

    return (
        <div className={`border rounded-xl p-4 ${cores[cor]}`}>
            <p className="text-sm">{titulo}</p>
            <p className="text-2xl font-bold">{valor}</p>
        </div>
    );
}
