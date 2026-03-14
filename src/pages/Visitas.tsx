"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { createVisita } from "@/integrations/supabase/visistas/createVisita"
import { getVisitas } from "@/integrations/supabase/visistas/getVisitas"
import { deleteVisita } from "@/integrations/supabase/visistas/deleteVisita"
import { Sidebar } from "@/components/Sidebar";
import {
  Dialog,
  DialogContent,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isBefore,
  startOfDay,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  MapPin,
  User,
  Home,
  Plus,
  Phone,
  Check,
  X,
  Trash2,
  Eye,
  Calendar as CalendarCheck,
  Loader2,
} from "lucide-react";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
}

interface Imovel {
  id: string;
  nome: string;
  endereco: string;
}

interface Visita {
  id: string;
  lead_id: string;
  imovel_id: string;
  data: Date;
  horario?: string;
  anotacoes?: string;
  status: "agendada" | "confirmada" | "realizada" | "cancelada" | "reagendada";
  lead?: Lead;
  imovel?: Imovel;
  clienteNome?: string;
  clienteTelefone?: string;
  imovelNome?: string;
  imovelEndereco?: string;
}

const statusConfig = {
  agendada: {
    label: "Agendada",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  confirmada: {
    label: "Confirmada",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  realizada: {
    label: "Realizada",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  reagendada: {
    label: "Reagendada",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
};

export default function Agenda() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [mesAtual, setMesAtual] = useState<Date>(startOfMonth(new Date()));
  const [dialogAberto, setDialogAberto] = useState(false);
  const [visitaSelecionada, setVisitaSelecionada] = useState<Visita | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [novaVisita, setNovaVisita] = useState({
    lead_id: "",
    imovel_id: "",
    data: new Date(),
    horario: "09:00",
    anotacoes: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([carregarVisitas(), carregarLeads(), carregarImoveis()]);
    } finally {
      setLoading(false);
    }
  };

  const carregarVisitas = async () => {
    try {
      const { data, error } = await getVisitas();

      if (error) throw error;

      const visitasFormatadas: Visita[] = (data || []).map((v: any) => ({
        id: v.id,
        lead_id: v.lead_id,
        imovel_id: v.imovel_id,
        data: typeof v.data === "string" ? parseISO(v.data) : new Date(v.data),
        anotacoes: v.anotacoes,
        status: "agendada" as const,
        clienteNome: v.clienteNome || "Cliente não encontrado",
        clienteTelefone: v.clienteTelefone || "",
        imovelNome: v.imovelNome || "Imóvel não encontrado",
        imovelEndereco: v.imovelEndereco || "",
      }));

      setVisitas(visitasFormatadas);
    } catch (err) {
      console.error("Erro ao carregar visitas:", err);
    }
  };

  const carregarLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, telefone")
        .order("nome", { ascending: true });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    }
  };

  const carregarImoveis = async () => {
    try {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, titulo, endereco")
        .order("titulo", { ascending: true });

      if (error) throw error;
      setImoveis(
        (data || []).map((i) => ({
          id: i.id,
          nome: i.titulo,
          endereco: i.endereco,
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar imóveis:", err);
    }
  };

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual),
  });

  const visitasData = (data: Date) =>
    visitas
      .filter((v) => isSameDay(v.data, data))
      .filter((v) => filtroStatus === "todas" || v.status === filtroStatus);

  const handleHoje = () => setMesAtual(startOfMonth(new Date()));

  const handleCriarVisita = async () => {
    if (!novaVisita.lead_id || !novaVisita.imovel_id) {
      alert("Por favor, selecione um lead e um imóvel.");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await createVisita({
        lead_id: novaVisita.lead_id,
        imovel_id: novaVisita.imovel_id,
        data: novaVisita.data.toISOString(),
        anotacoes: novaVisita.anotacoes || undefined,
      });

      if (error) throw new Error(error);

      setNovaVisita({
        lead_id: "",
        imovel_id: "",
        data: new Date(),
        horario: "09:00",
        anotacoes: "",
      });

      setDialogAberto(false);
      await carregarVisitas();
    } catch (err) {
      console.error("Erro ao criar visita:", err);
      alert("Erro ao criar visita. Verifique os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarStatus = async (id: string, status: Visita["status"]) => {
    setVisitas(visitas.map((v) => (v.id === id ? { ...v, status } : v)));
    if (visitaSelecionada?.id === id) {
      setVisitaSelecionada({ ...visitaSelecionada, status });
    }
  };

  const handleExcluirVisita = async (id: string) => {
    try {
      const { error } = await deleteVisita(id);

      if (error) throw new Error(error);

      setVisitas(visitas.filter((v) => v.id !== id));
      setVisitaSelecionada(null);
    } catch (err) {
      console.error("Erro ao excluir visita:", err);
      alert("Erro ao excluir visita.");
    }
  };

  const hoje = new Date();
  const visitasHoje = visitas.filter(
    (v) => isSameDay(v.data, hoje) && v.status !== "cancelada"
  ).length;
  const visitasMes = visitas.filter(
    (v) => isSameMonth(v.data, mesAtual) && v.status !== "cancelada"
  ).length;
  const visitasPendentes = visitas.filter((v) => v.status === "agendada").length;
  const visitasConfirmadas = visitas.filter((v) => v.status === "confirmada").length;

  const VisitaCard = ({ visita }: { visita: Visita }) => {
    const config = statusConfig[visita.status];
    const passada =
      isBefore(startOfDay(visita.data), startOfDay(new Date())) &&
      visita.status !== "realizada";

    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg border-l-4",
          config.dot.replace("bg-", "border-l-"),
          passada && visita.status === "agendada" && "opacity-70"
        )}
        onClick={() => setVisitaSelecionada(visita)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-xs font-medium border", config.color)}>
                  {config.label}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">
                    {visita.clienteNome}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {visita.imovelNome}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {visita.imovelEndereco}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="shrink-0">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="ml-16 p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-7 w-7 text-primary" />
              Visitas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as visitas aos imóveis
            </p>
          </div>
          <Button onClick={() => setDialogAberto(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-primary">{visitasHoje}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold text-blue-600">{visitasMes}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                  <p className="text-2xl font-bold text-amber-600">{visitasPendentes}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{visitasConfirmadas}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NAVEGAÇÃO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleHoje}>
              Hoje
            </Button>
            <span className="text-lg font-semibold capitalize">
              {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as visitas</SelectItem>
              <SelectItem value="agendada">Agendadas</SelectItem>
              <SelectItem value="confirmada">Confirmadas</SelectItem>
              <SelectItem value="realizada">Realizadas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CALENDÁRIO + LISTA */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Card className="h-fit">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={undefined}
                month={mesAtual}
                onMonthChange={(date) => setMesAtual(startOfMonth(date))}
                onSelect={(date) =>
                  date && setMesAtual(startOfMonth(date))
                }
                locale={ptBR}
                className="pointer-events-auto"
                modifiers={{
                  hasVisita: visitas.map((v) => v.data),
                }}
                modifiersClassNames={{
                  hasVisita: "bg-primary/20 font-bold",
                }}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {diasDoMes.map((dia) => {
              const visitasNoDia = visitasData(dia);
              const ehHoje = isToday(dia);

              if (visitasNoDia.length === 0 && !ehHoje) return null;

              return (
                <div key={dia.toISOString()} className="space-y-3">
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      ehHoje ? "bg-primary/10" : "bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-lg flex flex-col items-center justify-center",
                        ehHoje
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border"
                      )}
                    >
                      <span className="text-xs font-medium uppercase">
                        {format(dia, "EEE", { locale: ptBR })}
                      </span>
                      <span className="text-lg font-bold">{format(dia, "d")}</span>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-semibold capitalize",
                          ehHoje ? "text-primary" : "text-foreground"
                        )}
                      >
                        {ehHoje ? "Hoje" : format(dia, "EEEE", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {visitasNoDia.length}{" "}
                        {visitasNoDia.length === 1 ? "visita" : "visitas"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pl-4">
                    {visitasNoDia.length > 0 ? (
                      visitasNoDia.map((visita) => (
                        <VisitaCard key={visita.id} visita={visita} />
                      ))
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">
                            Nenhuma visita agendada para hoje
                          </p>
                          <Button
                            variant="link"
                            className="mt-2"
                            onClick={() => {
                              setNovaVisita({ ...novaVisita, data: dia });
                              setDialogAberto(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agendar visita
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}

            {diasDoMes.every(
              (dia) => visitasData(dia).length === 0 && !isToday(dia)
            ) && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Nenhuma visita este mês
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use o calendário para navegar ou agende uma nova visita
                    </p>
                    <Button className="mt-4" onClick={() => setDialogAberto(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar Visita
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </main>

      {/* DIALOG NOVA VISITA */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Agendar Nova Visita
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4 p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Selecionar Lead
              </h4>
              <div className="space-y-2">
                <Label htmlFor="lead">Lead / Cliente</Label>
                <Select
                  value={novaVisita.lead_id}
                  onValueChange={(value) =>
                    setNovaVisita({ ...novaVisita, lead_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum lead cadastrado
                      </SelectItem>
                    ) : (
                      leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.nome} - {lead.telefone}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Home className="h-4 w-4" />
                Selecionar Imóvel
              </h4>
              <div className="space-y-2">
                <Label htmlFor="imovel">Imóvel</Label>
                <Select
                  value={novaVisita.imovel_id}
                  onValueChange={(value) =>
                    setNovaVisita({ ...novaVisita, imovel_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    {imoveis.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum imóvel cadastrado
                      </SelectItem>
                    ) : (
                      imoveis.map((imovel) => (
                        <SelectItem key={imovel.id} value={imovel.id}>
                          {imovel.nome} - {imovel.endereco}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data da Visita</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(novaVisita.data, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={novaVisita.data}
                    onSelect={(d) =>
                      d && setNovaVisita({ ...novaVisita, data: d })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anotacoes">Anotações (opcional)</Label>
              <Textarea
                id="anotacoes"
                value={novaVisita.anotacoes}
                onChange={(e) =>
                  setNovaVisita({ ...novaVisita, anotacoes: e.target.value })
                }
                placeholder="Informações adicionais sobre a visita..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriarVisita}
              disabled={!novaVisita.lead_id || !novaVisita.imovel_id || salvando}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Agendar Visita
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DETALHES DA VISITA */}
      <Dialog
        open={!!visitaSelecionada}
        onOpenChange={(open) => !open && setVisitaSelecionada(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          {visitaSelecionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      statusConfig[visitaSelecionada.status].color.split(" ")[0]
                    )}
                  >
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block">Detalhes da Visita</span>
                    <Badge
                      className={cn(
                        "mt-1 text-xs font-medium border",
                        statusConfig[visitaSelecionada.status].color
                      )}
                    >
                      {statusConfig[visitaSelecionada.status].label}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium capitalize">
                      {format(visitaSelecionada.data, "EEEE, d 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Cliente
                  </h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{visitaSelecionada.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">
                          {visitaSelecionada.clienteTelefone}
                        </p>
                      </div>
                    </div>
                    {visitaSelecionada.clienteTelefone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${visitaSelecionada.clienteTelefone}`}>
                          <Phone className="h-4 w-4 mr-1" />
                          Ligar
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Imóvel
                  </h4>
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{visitaSelecionada.imovelNome}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {visitaSelecionada.imovelEndereco}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {visitaSelecionada.anotacoes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Anotações
                    </h4>
                    <p className="text-sm p-3 rounded-lg bg-muted/50">
                      {visitaSelecionada.anotacoes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {visitaSelecionada.status === "agendada" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() =>
                        handleAtualizarStatus(visitaSelecionada.id, "confirmada")
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Visita
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleAtualizarStatus(visitaSelecionada.id, "cancelada")
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
                {visitaSelecionada.status === "confirmada" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() =>
                        handleAtualizarStatus(visitaSelecionada.id, "realizada")
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como Realizada
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleAtualizarStatus(visitaSelecionada.id, "cancelada")
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleExcluirVisita(visitaSelecionada.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Visita
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}