"use client";

import { useState } from "react";
// ✅ REMOVIDO: useEffect — não precisamos mais dele, o React Query gerencia o ciclo de vida
// ✅ ADICIONADO: useQuery e useQueryClient para cache automático
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { createVisita } from "@/integrations/supabase/visistas/createVisita";
import { getVisitas } from "@/integrations/supabase/visistas/getVisitas";
import { deleteVisita } from "@/integrations/supabase/visistas/deleteVisita";
import { Sidebar } from "@/components/Sidebar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  format, isSameDay, isSameMonth, startOfMonth, endOfMonth,
  eachDayOfInterval, isToday, isBefore, startOfDay, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon, Clock, MapPin, User, Home, Plus, Phone,
  Check, X, Trash2, Eye, Calendar as CalendarCheck, Loader2,
} from "lucide-react";

interface Lead { id: string; nome: string; telefone: string; }
interface Imovel { id: string; nome: string; endereco: string; }
interface Visita {
  id: string; lead_id: string; imovel_id: string; data: Date;
  horario?: string; anotacoes?: string;
  status: "agendada" | "confirmada" | "realizada" | "cancelada" | "reagendada";
  lead?: Lead; imovel?: Imovel;
  clienteNome?: string; clienteTelefone?: string;
  imovelNome?: string; imovelEndereco?: string;
}

const statusConfig = {
  agendada: { label: "Agendada", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  confirmada: { label: "Confirmada", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  realizada: { label: "Realizada", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  reagendada: { label: "Reagendada", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

// ✅ ADICIONADO: funções get para leads e imóveis extraídas do componente
// Antes estavam inline no useEffect — agora são queryFns limpas para o React Query
async function fetchLeads(): Promise<Lead[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return [];

  const { data, error } = await supabase
    .from("leads")
    .select("id, nome, telefone")
    .eq("user_id", authData.user.id)
    .order("nome", { ascending: true });

  if (error) return [];
  return data || [];
}
async function fetchImoveis(): Promise<Imovel[]> {
  const { data, error } = await supabase
    .from("imoveis")
    .select("id, titulo, endereco")
    .order("titulo", { ascending: true });
  if (error) throw error;
  return (data || []).map((i) => ({ id: i.id, nome: i.titulo, endereco: i.endereco }));
}

// ✅ ADICIONADO: função que formata os dados brutos de visitas
// Antes estava inline dentro de carregarVisitas() — separar deixa o código mais limpo
function formatarVisitas(data: any[]): Visita[] {
  return data.map((v) => ({
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
}

const STALE = 1000 * 60 * 5; // ✅ 5 minutos de cache — mesmo padrão de Leads e Dashboard

export default function Agenda() {
  // ✅ REMOVIDO: useState para visitas, leads, imoveis e loading
  // Esses estados agora são gerenciados automaticamente pelo React Query

  const [mesAtual, setMesAtual] = useState<Date>(startOfMonth(new Date()));
  const [dialogAberto, setDialogAberto] = useState(false);
  const [visitaSelecionada, setVisitaSelecionada] = useState<Visita | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [salvando, setSalvando] = useState(false);
  const [novaVisita, setNovaVisita] = useState({
    lead_id: "", imovel_id: "", data: new Date(), horario: "09:00", anotacoes: "",
  });

  // ✅ ADICIONADO: queryClient para invalidar o cache após criar/excluir visita
  const queryClient = useQueryClient();

  // ✅ MIGRADO: carregarVisitas() virou useQuery
  // Antes: useEffect chamava carregarVisitas() → setVisitas()
  // Agora: React Query chama getVisitas(), cacheia por 5min e expõe { data, isLoading }
  const { data: visitasBrutas = [], isLoading: loadingVisitas } = useQuery({
    queryKey: ["visitas"],
    queryFn: async () => {
      const { data, error } = await getVisitas();
      if (error) throw error;
      return formatarVisitas(data || []);
    },
    staleTime: STALE,
  });

  // ✅ MIGRADO: carregarLeads() virou useQuery
  // queryKey: ["leads"] é a MESMA chave usada em Leads.tsx e Dashboard.tsx
  // → se o usuário já visitou essas telas, os dados vêm do cache sem bater no banco
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    staleTime: STALE,
  });

  // ✅ MIGRADO: carregarImoveis() virou useQuery com cache compartilhado
  const { data: imoveis = [], isLoading: loadingImoveis } = useQuery({
    queryKey: ["imoveis"],
    queryFn: fetchImoveis,
    staleTime: STALE,
  });

  // ✅ ADICIONADO: visitas agora é imutável (vem do cache)
  // Para atualizar status localmente sem refetch, usamos setQueryData
  const visitas = visitasBrutas;

  const loading = loadingVisitas || loadingLeads || loadingImoveis;

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
      setNovaVisita({ lead_id: "", imovel_id: "", data: new Date(), horario: "09:00", anotacoes: "" });
      setDialogAberto(false);

      // ✅ MIGRADO: era await carregarVisitas() — agora invalida o cache
      // O React Query vai buscar os dados atualizados automaticamente
      queryClient.invalidateQueries({ queryKey: ["visitas"] });
    } catch (err) {
      console.error("Erro ao criar visita:", err);
      alert("Erro ao criar visita. Verifique os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  // ✅ MIGRADO: antes fazia setVisitas() diretamente no estado local
  // Agora usa setQueryData para atualizar o cache do React Query sem refetch
  // Isso mantém a UI responsiva e o cache consistente ao mesmo tempo
  const handleAtualizarStatus = async (id: string, status: Visita["status"]) => {
    queryClient.setQueryData<Visita[]>(["visitas"], (old = []) =>
      old.map((v) => (v.id === id ? { ...v, status } : v))
    );
    if (visitaSelecionada?.id === id) {
      setVisitaSelecionada((prev) => prev ? { ...prev, status } : prev);
    }
  };

  const handleExcluirVisita = async (id: string) => {
    try {
      const { error } = await deleteVisita(id);
      if (error) throw new Error(error);

      // ✅ MIGRADO: era setVisitas(visitas.filter(...)) no estado local
      // Agora atualiza o cache diretamente com setQueryData — sem refetch desnecessário
      queryClient.setQueryData<Visita[]>(["visitas"], (old = []) =>
        old.filter((v) => v.id !== id)
      );
      setVisitaSelecionada(null);
    } catch (err) {
      console.error("Erro ao excluir visita:", err);
      alert("Erro ao excluir visita.");
    }
  };

  const hoje = new Date();
  const visitasHoje = visitas.filter((v) => isSameDay(v.data, hoje) && v.status !== "cancelada").length;
  const visitasMes = visitas.filter((v) => isSameMonth(v.data, mesAtual) && v.status !== "cancelada").length;
  const visitasPendentes = visitas.filter((v) => v.status === "agendada").length;
  const visitasConfirmadas = visitas.filter((v) => v.status === "confirmada").length;

  const VisitaCard = ({ visita }: { visita: Visita }) => {
    const config = statusConfig[visita.status];
    const passada = isBefore(startOfDay(visita.data), startOfDay(new Date())) && visita.status !== "realizada";
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg border-l-4",
          config.dot.replace("bg-", "border-l-"),
          passada && visita.status === "agendada" && "opacity-70"
        )}
        onClick={() => setVisitaSelecionada(visita)}
      >
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-xs font-medium border", config.color)}>{config.label}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm text-foreground truncate">{visita.clienteNome}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Home className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-foreground truncate">{visita.imovelNome}</p>
                    <p className="text-xs text-muted-foreground truncate">{visita.imovelEndereco}</p>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <Eye className="h-3.5 w-3.5" />
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
      <main className="md:ml-16 pb-24 md:pb-0 p-4 md:p-8 space-y-4 md:space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 md:h-7 md:w-7 text-primary" />
              Visitas
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
              Gerencie as visitas aos imóveis
            </p>
          </div>
          <Button onClick={() => setDialogAberto(true)} className="gap-1.5 h-9 px-3 md:px-4 text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Visita</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>

        {/* CARDS RESUMO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">Hoje</p><p className="text-xl md:text-2xl font-bold text-primary">{visitasHoje}</p></div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center"><CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">Este Mês</p><p className="text-xl md:text-2xl font-bold text-blue-600">{visitasMes}</p></div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-500/10 flex items-center justify-center"><CalendarCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">Aguardando</p><p className="text-xl md:text-2xl font-bold text-amber-600">{visitasPendentes}</p></div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-amber-500/10 flex items-center justify-center"><Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">Confirmadas</p><p className="text-xl md:text-2xl font-bold text-emerald-600">{visitasConfirmadas}</p></div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-emerald-500/10 flex items-center justify-center"><Check className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NAVEGAÇÃO / FILTRO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="outline" size="sm" onClick={handleHoje} className="h-8 text-xs md:text-sm">Hoje</Button>
            <span className="text-base md:text-lg font-semibold capitalize">
              {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs md:text-sm">
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
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6">
          <Card className="h-fit">
            <CardContent className="p-2 md:p-4">
              <Calendar
                mode="single"
                selected={undefined}
                month={mesAtual}
                onMonthChange={(date) => setMesAtual(startOfMonth(date))}
                onSelect={(date) => date && setMesAtual(startOfMonth(date))}
                locale={ptBR}
                className="pointer-events-auto w-full"
                modifiers={{ hasVisita: visitas.map((v) => v.data) }}
                modifiersClassNames={{ hasVisita: "bg-primary/20 font-bold" }}
              />
            </CardContent>
          </Card>

          <div className="space-y-3 md:space-y-4">
            {diasDoMes.map((dia) => {
              const visitasNoDia = visitasData(dia);
              const ehHoje = isToday(dia);
              if (visitasNoDia.length === 0 && !ehHoje) return null;
              return (
                <div key={dia.toISOString()} className="space-y-2 md:space-y-3">
                  <div className={cn("flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg", ehHoje ? "bg-primary/10" : "bg-muted/50")}>
                    <div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-lg flex flex-col items-center justify-center shrink-0", ehHoje ? "bg-primary text-primary-foreground" : "bg-background border")}>
                      <span className="text-[10px] md:text-xs font-medium uppercase">{format(dia, "EEE", { locale: ptBR })}</span>
                      <span className="text-base md:text-lg font-bold">{format(dia, "d")}</span>
                    </div>
                    <div>
                      <p className={cn("font-semibold capitalize text-sm md:text-base", ehHoje ? "text-primary" : "text-foreground")}>
                        {ehHoje ? "Hoje" : format(dia, "EEEE", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {visitasNoDia.length} {visitasNoDia.length === 1 ? "visita" : "visitas"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3 pl-2 md:pl-4">
                    {visitasNoDia.length > 0 ? (
                      visitasNoDia.map((visita) => <VisitaCard key={visita.id} visita={visita} />)
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-4 md:p-6 text-center">
                          <p className="text-sm text-muted-foreground">Nenhuma visita agendada para hoje</p>
                          <Button variant="link" className="mt-2 text-sm" onClick={() => { setNovaVisita({ ...novaVisita, data: dia }); setDialogAberto(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Agendar visita
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}
            {diasDoMes.every((dia) => visitasData(dia).length === 0 && !isToday(dia)) && (
              <Card className="border-dashed">
                <CardContent className="p-6 md:p-8 text-center">
                  <CalendarCheck className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/50 mb-3 md:mb-4" />
                  <p className="text-base md:text-lg font-medium text-muted-foreground">Nenhuma visita este mês</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Use o calendário para navegar ou agende uma nova visita</p>
                  <Button className="mt-4 text-sm" onClick={() => setDialogAberto(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Agendar Visita
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* DIALOG NOVA VISITA */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[500px] rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <CalendarCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Agendar Nova Visita
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-3 md:py-4">
            <div className="space-y-3 p-3 md:p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-xs md:text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Selecionar Lead</h4>
              <div className="space-y-2">
                <Label htmlFor="lead" className="text-xs md:text-sm">Lead / Cliente</Label>
                <Select value={novaVisita.lead_id} onValueChange={(value) => setNovaVisita({ ...novaVisita, lead_id: value })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                  <SelectContent>
                    {leads.length === 0 ? (
                      <SelectItem value="" disabled>Nenhum lead cadastrado</SelectItem>
                    ) : (
                      leads.map((lead) => <SelectItem key={lead.id} value={lead.id}>{lead.nome} - {lead.telefone}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 p-3 md:p-4 rounded-lg bg-muted/30">
              <h4 className="font-medium text-xs md:text-sm text-muted-foreground flex items-center gap-2"><Home className="h-4 w-4" />Selecionar Imóvel</h4>
              <div className="space-y-2">
                <Label htmlFor="imovel" className="text-xs md:text-sm">Imóvel</Label>
                <Select value={novaVisita.imovel_id} onValueChange={(value) => setNovaVisita({ ...novaVisita, imovel_id: value })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione um imóvel" /></SelectTrigger>
                  <SelectContent>
                    {imoveis.length === 0 ? (
                      <SelectItem value="" disabled>Nenhum imóvel cadastrado</SelectItem>
                    ) : (
                      imoveis.map((imovel) => <SelectItem key={imovel.id} value={imovel.id}>{imovel.nome} - {imovel.endereco}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Data da Visita</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent h-9 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(novaVisita.data, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={novaVisita.data}
                    onSelect={(d) => d && setNovaVisita({ ...novaVisita, data: d })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anotacoes" className="text-xs md:text-sm">Anotações (opcional)</Label>
              <Textarea
                id="anotacoes"
                value={novaVisita.anotacoes}
                onChange={(e) => setNovaVisita({ ...novaVisita, anotacoes: e.target.value })}
                placeholder="Informações adicionais sobre a visita..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 md:gap-3">
            <Button variant="outline" onClick={() => setDialogAberto(false)} className="h-9 text-sm">Cancelar</Button>
            <Button onClick={handleCriarVisita} disabled={!novaVisita.lead_id || !novaVisita.imovel_id || salvando} className="h-9 text-sm">
              {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DETALHES DA VISITA */}
      <Dialog open={!!visitaSelecionada} onOpenChange={(open) => !open && setVisitaSelecionada(null)}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[500px] rounded-2xl p-4 md:p-6">
          {visitaSelecionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-base md:text-lg">
                  <div className={cn("h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0", statusConfig[visitaSelecionada.status].color.split(" ")[0])}>
                    <CalendarCheck className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div>
                    <span className="block text-sm md:text-base">Detalhes da Visita</span>
                    <Badge className={cn("mt-1 text-xs font-medium border", statusConfig[visitaSelecionada.status].color)}>
                      {statusConfig[visitaSelecionada.status].label}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 md:space-y-4 py-3 md:py-4">
                <div className="flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                  <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                  <p className="font-medium capitalize text-sm md:text-base">
                    {format(visitaSelecionada.data, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs md:text-sm font-medium text-muted-foreground">Cliente</h4>
                  <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg border gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{visitaSelecionada.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">{visitaSelecionada.clienteTelefone}</p>
                      </div>
                    </div>
                    {visitaSelecionada.clienteTelefone && (
                      <Button variant="outline" size="sm" asChild className="h-8 text-xs shrink-0">
                        <a href={`tel:${visitaSelecionada.clienteTelefone}`}><Phone className="h-3.5 w-3.5 mr-1" />Ligar</a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs md:text-sm font-medium text-muted-foreground">Imóvel</h4>
                  <div className="p-2.5 md:p-3 rounded-lg border">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Home className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{visitaSelecionada.imovelNome}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{visitaSelecionada.imovelEndereco}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {visitaSelecionada.anotacoes && (
                  <div className="space-y-2">
                    <h4 className="text-xs md:text-sm font-medium text-muted-foreground">Anotações</h4>
                    <p className="text-sm p-2.5 md:p-3 rounded-lg bg-muted/50">{visitaSelecionada.anotacoes}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 md:gap-3">
                {visitaSelecionada.status === "agendada" && (
                  <div className="flex gap-2">
                    <Button className="flex-1 h-9 text-sm" onClick={() => handleAtualizarStatus(visitaSelecionada.id, "confirmada")}>
                      <Check className="h-4 w-4 mr-1.5" />Confirmar
                    </Button>
                    <Button variant="outline" className="h-9 text-sm" onClick={() => handleAtualizarStatus(visitaSelecionada.id, "cancelada")}>
                      <X className="h-4 w-4 mr-1.5" />Cancelar
                    </Button>
                  </div>
                )}
                {visitaSelecionada.status === "confirmada" && (
                  <div className="flex gap-2">
                    <Button className="flex-1 h-9 text-sm" onClick={() => handleAtualizarStatus(visitaSelecionada.id, "realizada")}>
                      <Check className="h-4 w-4 mr-1.5" />Marcar Realizada
                    </Button>
                    <Button variant="outline" className="h-9 text-sm" onClick={() => handleAtualizarStatus(visitaSelecionada.id, "cancelada")}>
                      <X className="h-4 w-4 mr-1.5" />Cancelar
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 text-sm"
                  onClick={() => handleExcluirVisita(visitaSelecionada.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />Excluir Visita
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}