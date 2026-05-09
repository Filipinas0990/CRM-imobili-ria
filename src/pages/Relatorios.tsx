import { useState, useMemo } from "react";
import {
  TrendingUp, Users, Eye, Target, DollarSign,
  ArrowUpRight, ArrowDownRight, Trophy,
  Building2, Flame, Zap,
  CalendarDays, BarChart3, Activity,
  Timer, CalendarCheck2, AlertCircle, Wallet,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/services/lead.service";
import { vendaService } from "@/services/venda.service";
import { visitaService } from "@/services/visita.service";
import { imovelService } from "@/services/imovel.service";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
type Period = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

// ─── Constants ───────────────────────────────────────────────────────────────
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: "7 dias",   value: "7d" },
  { label: "30 dias",  value: "30d" },
  { label: "90 dias",  value: "90d" },
  { label: "6 meses",  value: "6m" },
  { label: "1 ano",    value: "1y" },
  { label: "Tudo",     value: "all" },
];

const FUNNEL_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#f97316", "#22c55e"];
const TEMP_COLORS   = ["#3b82f6", "#f59e0b", "#ef4444"];
const AREA_COLORS   = ["#22c55e", "#ef4444"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCompact(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `R$ ${(value / 1_000).toFixed(0)}K`;
  return fmt(value);
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function getPeriodRange(period: Period): { start: Date | null; prevStart: Date | null; prevEnd: Date | null } {
  if (period === "all") return { start: null, prevStart: null, prevEnd: null };
  const now  = new Date();
  const days = { "7d": 7, "30d": 30, "90d": 90, "6m": 180, "1y": 365 }[period]!;
  const start     = new Date(now.getTime() - days * 86_400_000);
  const prevStart = new Date(now.getTime() - days * 2 * 86_400_000);
  return { start, prevStart, prevEnd: start };
}

function inRange(dateStr: string, start: Date | null, end?: Date | null) {
  const d = new Date(dateStr);
  if (start && d < start) return false;
  if (end   && d >= end)  return false;
  return true;
}

function trendPct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function activityColor(count: number) {
  if (count === 0) return "bg-muted";
  if (count <= 1)  return "bg-green-200 dark:bg-green-900/60";
  if (count <= 3)  return "bg-green-400 dark:bg-green-700/80";
  return "bg-green-600 dark:bg-green-500";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Period>("30d");

  // Queries — reuse shared cache keys
  const { data: leadsAll    = [] } = useQuery({ queryKey: ["leads"],    queryFn: () => leadService.getAll() });
  const { data: vendasAll   = [] } = useQuery({ queryKey: ["vendas"],   queryFn: () => vendaService.getAll() });
  const { data: visitasAll  = [] } = useQuery({ queryKey: ["visitas"],  queryFn: () => visitaService.getAll() });
  const { data: imoveisAll  = [] } = useQuery({ queryKey: ["imoveis"],  queryFn: () => imovelService.getAll() });

  const range = useMemo(() => getPeriodRange(periodo), [periodo]);

  // ── Filtered sets ──────────────────────────────────────────────────────────
  const leads   = useMemo(() => leadsAll.filter(l => inRange(l.created_at, range.start)), [leadsAll, range]);
  const vendas  = useMemo(() => vendasAll.filter(v => inRange(v.created_at, range.start)), [vendasAll, range]);
  const visitas = useMemo(() => visitasAll.filter(v => inRange(v.data, range.start)), [visitasAll, range]);

  const leadsPrev  = useMemo(() => leadsAll.filter(l => inRange(l.created_at, range.prevStart, range.prevEnd)), [leadsAll, range]);
  const vendasPrev = useMemo(() => vendasAll.filter(v => inRange(v.created_at, range.prevStart, range.prevEnd)), [vendasAll, range]);

  // ── Hero KPIs ─────────────────────────────────────────────────────────────
  const vendasFechadas     = useMemo(() => vendas.filter(v => v.status === "Fechada"), [vendas]);
  const vendasFechadasPrev = useMemo(() => vendasPrev.filter(v => v.status === "Fechada"), [vendasPrev]);
  const receitaTotal    = useMemo(() => vendasFechadas.reduce((s, v) => s + Number(v.valor), 0), [vendasFechadas]);
  const receitaPrev     = useMemo(() => vendasFechadasPrev.reduce((s, v) => s + Number(v.valor), 0), [vendasFechadasPrev]);
  const ticketMedio     = vendasFechadas.length > 0 ? receitaTotal / vendasFechadas.length : 0;
  const taxaConversao   = leads.length > 0 ? (vendasFechadas.length / leads.length) * 100 : 0;
  const visitasRealizadas = useMemo(() => visitas.filter(v => v.status === "realizada").length, [visitas]);
  const visitasRealPrev   = useMemo(() => visitasAll.filter(v => v.status === "realizada" && inRange(v.data, range.prevStart, range.prevEnd)).length, [visitasAll, range]);

  // ── Funil de conversão ────────────────────────────────────────────────────
  const funil = useMemo(() => {
    const total       = leads.length;
    const contatados  = leads.filter(l => ["contato", "Visista", "Proposta"].includes(l.status)).length;
    const comVisita   = leads.filter(l => ["Visista", "Proposta"].includes(l.status)).length;
    const comProposta = leads.filter(l => l.status === "Proposta").length;
    const fechados    = vendasFechadas.length;
    return [
      { label: "Leads Captados",   count: total,       color: FUNNEL_COLORS[0] },
      { label: "Em Contato",       count: contatados,  color: FUNNEL_COLORS[1] },
      { label: "Visita Agendada",  count: comVisita,   color: FUNNEL_COLORS[2] },
      { label: "Proposta Enviada", count: comProposta, color: FUNNEL_COLORS[3] },
      { label: "Negócio Fechado",  count: fechados,    color: FUNNEL_COLORS[4] },
    ];
  }, [leads, vendasFechadas]);

  // ── Score de performance ──────────────────────────────────────────────────
  const score = useMemo(() => {
    const convScore = Math.min(taxaConversao * 3, 30);
    const hotLeads  = leads.filter(l => l.temperatura === 3).length;
    const hotScore  = leads.length > 0 ? Math.min((hotLeads / leads.length) * 100, 20) : 0;
    const visitScore = visitas.length > 0 ? Math.min((visitasRealizadas / visitas.length) * 20, 20) : 0;
    const revenueScore = receitaTotal > 0 ? Math.min(30, 30) : receitaTotal > 0 ? 15 : 0;
    return Math.round(convScore + hotScore + visitScore + revenueScore);
  }, [taxaConversao, leads, visitasRealizadas, visitas, receitaTotal]);

  const scoreTier = score >= 70 ? { label: "Excelente", color: "#22c55e" } :
                    score >= 45 ? { label: "Bom",       color: "#f59e0b" } :
                                  { label: "Atenção",   color: "#ef4444" };

  // ── Ciclo médio de venda (dias) ──────────────────────────────────────────
  const cicloMedioVenda = useMemo(() => {
    const pares = vendasFechadas
      .map(v => {
        const lead = leadsAll.find(l => l.id === v.lead_id);
        if (!lead) return null;
        const inicio = new Date(lead.created_at).getTime();
        const fim    = new Date(v.data_venda || v.created_at).getTime();
        return Math.max(0, Math.round((fim - inicio) / 86_400_000));
      })
      .filter((d): d is number => d !== null);
    if (pares.length === 0) return 0;
    return Math.round(pares.reduce((s, d) => s + d, 0) / pares.length);
  }, [vendasFechadas, leadsAll]);

  // ── Taxa de show (visitas realizadas / agendadas) ─────────────────────
  const taxaShow = visitas.length > 0
    ? (visitasRealizadas / visitas.length) * 100
    : 0;

  // ── Leads inativos (sem atualização há +30 dias) ──────────────────────
  const leadsInativos = useMemo(() => {
    const limite = new Date(Date.now() - 30 * 86_400_000);
    return leadsAll.filter(l => {
      const ref = new Date(l.updated_at ?? l.created_at);
      return ref < limite && !["fechado", "bolsao", "desistiu"].includes(l.status);
    }).length;
  }, [leadsAll]);

  // ── Valor em pipeline (vendas em aberto) ──────────────────────────────
  const valorPipeline = useMemo(() =>
    vendas
      .filter(v => ["Em negociação", "Proposta enviada"].includes(v.status))
      .reduce((s, v) => s + Number(v.valor), 0),
  [vendas]);

  // ── Chart de receita anterior (comparação) ────────────────────────────
  const chartReceitaAnterior = useMemo(() => {
    if (!range.prevStart || !range.prevEnd) return [];
    const vendasPrev2 = vendasAll.filter(v =>
      inRange(v.created_at, range.prevStart, range.prevEnd)
    );
    const hoje = new Date();
    const numMeses = periodo === "7d" || periodo === "30d" || periodo === "90d" ? null : (periodo === "1y" ? 12 : 6);
    if (!numMeses) return [];
    return Array.from({ length: numMeses }, (_, i) => {
      const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (numMeses - 1 - i) - numMeses, 1);
      const ano = d.getFullYear(); const mes = d.getMonth();
      return vendasPrev2
        .filter(v => v.status === "Fechada")
        .filter(v => { const x = new Date(v.data_venda || v.created_at); return x.getFullYear() === ano && x.getMonth() === mes; })
        .reduce((s, v) => s + Number(v.valor), 0);
    });
  }, [vendasAll, range, periodo]);

  // ── Gráfico de leads captados ao longo do tempo ───────────────────────
  const chartLeads = useMemo(() => {
    const hoje = new Date();
    const fonte = periodo === "all" ? leadsAll : leads;

    if (periodo === "7d") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        return {
          label: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][d.getDay()],
          leads: fonte.filter(l => l.created_at.startsWith(dateStr)).length,
        };
      });
    }
    if (periodo === "30d") {
      return Array.from({ length: 4 }, (_, semIdx) => {
        const endDaysAgo   = (3 - semIdx) * 7;
        const startDaysAgo = endDaysAgo + 6;
        const start = new Date(); start.setDate(start.getDate() - startDaysAgo); start.setHours(0, 0, 0, 0);
        const end   = new Date(); end.setDate(end.getDate() - endDaysAgo);       end.setHours(23, 59, 59, 999);
        return {
          label: `Sem ${semIdx + 1}`,
          leads: fonte.filter(l => { const d = new Date(l.created_at); return d >= start && d <= end; }).length,
        };
      });
    }
    const numMeses = periodo === "1y" || periodo === "all" ? 12 : periodo === "90d" ? 3 : 6;
    const fonteMeses = periodo === "all" ? leadsAll : leads;
    return Array.from({ length: numMeses }, (_, i) => {
      const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (numMeses - 1 - i), 1);
      const ano = d.getFullYear(); const mes = d.getMonth();
      return {
        label: MESES[mes],
        leads: fonteMeses.filter(l => {
          const x = new Date(l.created_at);
          return x.getFullYear() === ano && x.getMonth() === mes;
        }).length,
      };
    });
  }, [periodo, leads, leadsAll]);

  // ── Gráfico de receita — granularidade adaptada ao período ───────────────
  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const chartReceita = useMemo(() => {
    const hoje = new Date();

    if (periodo === "7d") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const receita = vendas
          .filter(v => v.status === "Fechada" && (v.data_venda || v.created_at).startsWith(dateStr))
          .reduce((s, v) => s + Number(v.valor), 0);
        return { label: DIAS_SEMANA[d.getDay()], receita };
      });
    }

    if (periodo === "30d") {
      return Array.from({ length: 4 }, (_, semIdx) => {
        const endDaysAgo   = (3 - semIdx) * 7;
        const startDaysAgo = endDaysAgo + 6;
        const start = new Date(); start.setDate(start.getDate() - startDaysAgo); start.setHours(0, 0, 0, 0);
        const end   = new Date(); end.setDate(end.getDate() - endDaysAgo);       end.setHours(23, 59, 59, 999);
        const receita = vendas
          .filter(v => v.status === "Fechada")
          .filter(v => { const d = new Date(v.data_venda || v.created_at); return d >= start && d <= end; })
          .reduce((s, v) => s + Number(v.valor), 0);
        return { label: `Sem ${semIdx + 1}`, receita };
      });
    }

    if (periodo === "90d") {
      return Array.from({ length: 3 }, (_, i) => {
        const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (2 - i), 1);
        const ano = d.getFullYear(); const mes = d.getMonth();
        const receita = vendas
          .filter(v => v.status === "Fechada")
          .filter(v => { const x = new Date(v.data_venda || v.created_at); return x.getFullYear() === ano && x.getMonth() === mes; })
          .reduce((s, v) => s + Number(v.valor), 0);
        return { label: MESES[mes], receita };
      });
    }

    // 6m → 6 meses | 1y → 12 meses | all → últimos 12 meses (histórico)
    const numMeses = periodo === "1y" || periodo === "all" ? 12 : 6;
    const fonte    = periodo === "all" ? vendasAll : vendas;
    return Array.from({ length: numMeses }, (_, i) => {
      const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (numMeses - 1 - i), 1);
      const ano = d.getFullYear(); const mes = d.getMonth();
      const receita = fonte
        .filter(v => v.status === "Fechada")
        .filter(v => { const x = new Date(v.data_venda || v.created_at); return x.getFullYear() === ano && x.getMonth() === mes; })
        .reduce((s, v) => s + Number(v.valor), 0);
      return { label: MESES[mes], receita };
    });
  }, [periodo, vendas, vendasAll]);

  const chartTitle = {
    "7d":  "Receita — Últimos 7 Dias",
    "30d": "Receita — Últimas 4 Semanas",
    "90d": "Receita — Últimos 3 Meses",
    "6m":  "Receita — Últimos 6 Meses",
    "1y":  "Receita — Último Ano",
    "all": "Receita — Histórico",
  }[periodo];

  // ── Temperatura dos leads ─────────────────────────────────────────────────
  const tempData = useMemo(() => {
    const frio   = leads.filter(l => l.temperatura === 1).length;
    const morno  = leads.filter(l => l.temperatura === 2).length;
    const quente = leads.filter(l => l.temperatura === 3).length;
    const total  = leads.length || 1;
    return [
      { name: "Frio",   value: frio,   pct: ((frio / total) * 100).toFixed(0) },
      { name: "Morno",  value: morno,  pct: ((morno / total) * 100).toFixed(0) },
      { name: "Quente", value: quente, pct: ((quente / total) * 100).toFixed(0) },
    ];
  }, [leads]);

  // ── Ranking de corretores ─────────────────────────────────────────────────
  const rankingCorretores = useMemo(() => {
    const map = new Map<string, { leads: number; vendas: number; receita: number }>();
    // leads do período
    leads.forEach(l => {
      if (!l.gestor_responsavel) return;
      const k = l.gestor_responsavel;
      const c = map.get(k) ?? { leads: 0, vendas: 0, receita: 0 };
      map.set(k, { ...c, leads: c.leads + 1 });
    });
    // vendas fechadas do período (usa leadsAll para lookup de gestor)
    vendas.filter(v => v.status === "Fechada").forEach(v => {
      if (!v.lead_id) return;
      const lead = leadsAll.find(l => l.id === v.lead_id);
      if (!lead?.gestor_responsavel) return;
      const k = lead.gestor_responsavel;
      const c = map.get(k) ?? { leads: 0, vendas: 0, receita: 0 };
      map.set(k, { ...c, vendas: c.vendas + 1, receita: c.receita + Number(v.valor) });
    });
    return Array.from(map.entries())
      .map(([name, s]) => ({ name, ...s, conv: s.leads > 0 ? ((s.vendas / s.leads) * 100).toFixed(0) : "0" }))
      .sort((a, b) => b.receita - a.receita || b.leads - a.leads)
      .slice(0, 5);
  }, [leads, vendas, leadsAll]);

  // ── Imóveis mais visitados ────────────────────────────────────────────────
  const imoveisMaisVisitados = useMemo(() => {
    const map = new Map<string, { titulo: string; tipo?: string; visitas: number }>();
    visitas.forEach(v => {
      const im = imoveisAll.find(i => i.id === v.imovel_id);
      if (!im) return;
      const c = map.get(v.imovel_id) ?? { titulo: im.titulo, tipo: im.tipo, visitas: 0 };
      map.set(v.imovel_id, { ...c, visitas: c.visitas + 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.visitas - a.visitas).slice(0, 6);
  }, [visitas, imoveisAll]);

  const maxVisitas = Math.max(...imoveisMaisVisitados.map(i => i.visitas), 1);

  // ── Activity heatmap (last 84 days) ───────────────────────────────────────
  const heatmap = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 83; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = 0;
    }
    leadsAll.forEach(l => { const k = l.created_at.split("T")[0]; if (k in days) days[k]++; });
    visitasAll.forEach(v => { const k = v.data.split("T")[0]; if (k in days) days[k]++; });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [leadsAll, visitasAll]);

  // ── Vendas por status ─────────────────────────────────────────────────────
  const vendasPorStatus = useMemo(() => {
    const map = new Map<string, number>();
    vendas.forEach(v => map.set(v.status, (map.get(v.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [vendas]);

  const statusColor: Record<string, string> = {
    "Fechada":          "#22c55e",
    "Em negociação":    "#3b82f6",
    "Proposta enviada": "#f59e0b",
    "Perdida":          "#ef4444",
  };

  // ─── JSX ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-20 p-6 md:p-8 space-y-8 overflow-y-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios & Analytics</h1>
            <p className="text-muted-foreground mt-1">Visão completa do desempenho da sua imobiliária</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 self-start md:self-auto">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriodo(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg font-medium transition-all",
                  periodo === opt.value
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Hero KPIs ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Receita Total",
              value: fmtCompact(receitaTotal),
              trend: trendPct(receitaTotal, receitaPrev),
              icon: DollarSign,
              grad: "from-emerald-600 to-green-500",
              sub: `${vendasFechadas.length} venda${vendasFechadas.length !== 1 ? "s" : ""} fechada${vendasFechadas.length !== 1 ? "s" : ""}`,
            },
            {
              label: "Leads Captados",
              value: String(leads.length),
              trend: trendPct(leads.length, leadsPrev.length),
              icon: Users,
              grad: "from-blue-600 to-indigo-500",
              sub: `${leadsAll.length} total na base`,
            },
            {
              label: "Taxa de Conversão",
              value: `${taxaConversao.toFixed(1)}%`,
              trend: trendPct(vendasFechadas.length, vendasFechadasPrev.length),
              icon: Target,
              grad: "from-orange-600 to-amber-500",
              sub: "Leads → Vendas fechadas",
            },
            {
              label: "Visitas Realizadas",
              value: String(visitasRealizadas),
              trend: trendPct(visitasRealizadas, visitasRealPrev),
              icon: Eye,
              grad: "from-purple-600 to-violet-500",
              sub: `de ${visitas.length} agendadas`,
            },
            {
              label: "Ticket Médio",
              value: fmtCompact(ticketMedio),
              trend: 0,
              icon: TrendingUp,
              grad: "from-teal-600 to-cyan-500",
              sub: "por venda fechada",
            },
          ].map((card) => (
            <Card
              key={card.label}
              className={cn(
                "relative overflow-hidden border-0 text-white",
                `bg-gradient-to-br ${card.grad}`
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                  {card.trend !== 0 && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      card.trend > 0 ? "bg-white/20 text-white" : "bg-black/20 text-white/80"
                    )}>
                      {card.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(card.trend).toFixed(0)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight text-white">{card.value}</p>
                <p className="text-xs text-white/70 mt-1">{card.label}</p>
                <p className="text-xs text-white/50 mt-0.5">{card.sub}</p>
              </CardContent>
              {/* decorative circle */}
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute -right-2 -bottom-10 w-20 h-20 rounded-full bg-white/5" />
            </Card>
          ))}
        </div>

        {/* ── Métricas analíticas ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Ciclo médio de venda",
              value: cicloMedioVenda > 0 ? `${cicloMedioVenda} dias` : "—",
              sub: "Da captação ao fechamento",
              icon: Timer,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Taxa de show",
              value: taxaShow > 0 ? `${taxaShow.toFixed(0)}%` : "—",
              sub: `${visitasRealizadas} de ${visitas.length} visitas realizadas`,
              icon: CalendarCheck2,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Leads inativos",
              value: String(leadsInativos),
              sub: "Sem atualização há +30 dias",
              icon: AlertCircle,
              color: leadsInativos > 0 ? "text-amber-500" : "text-muted-foreground",
              bg: leadsInativos > 0 ? "bg-amber-500/10" : "bg-muted",
            },
            {
              label: "Valor em pipeline",
              value: fmtCompact(valorPipeline),
              sub: "Vendas em negociação/proposta",
              icon: Wallet,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
          ].map((item) => (
            <Card key={item.label} className="shadow-sm">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Funil + Score ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Funil de conversão */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Funil de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funil.map((step, i) => {
                const pct = funil[0].count > 0 ? (step.count / funil[0].count) * 100 : 0;
                const conv = i > 0 && funil[i - 1].count > 0
                  ? `${((step.count / funil[i - 1].count) * 100).toFixed(0)}% do anterior`
                  : "";
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-sm font-medium">{step.label}</span>
                        {conv && <span className="text-xs text-muted-foreground">({conv})</span>}
                      </div>
                      <span className="text-sm font-bold" style={{ color: step.color }}>{step.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct, step.count > 0 ? 2 : 0)}%`, backgroundColor: step.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Score de Performance */}
          <Card className="flex flex-col items-center justify-center p-6">
            <p className="text-sm font-medium text-muted-foreground mb-4">Score de Performance</p>
            {/* Gauge SVG */}
            <div className="relative w-40 h-40 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={scoreTier.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 314} 314`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black" style={{ color: scoreTier.color }}>{score}</span>
                <span className="text-xs text-muted-foreground">de 100</span>
              </div>
            </div>
            <Badge
              className="text-white font-bold px-4 py-1 text-sm"
              style={{ backgroundColor: scoreTier.color }}
            >
              {scoreTier.label}
            </Badge>
            <div className="mt-4 w-full space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Taxa de conversão</span>
                <span className="font-semibold text-foreground">{taxaConversao.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Leads quentes</span>
                <span className="font-semibold text-foreground">
                  {leads.filter(l => l.temperatura === 3).length}/{leads.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Visitas concluídas</span>
                <span className="font-semibold text-foreground">{visitasRealizadas}/{visitas.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Receita mensal + Temperatura ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Receita mensal */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                {chartTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartReceita.map((p, i) => ({
                    ...p,
                    anterior: chartReceitaAnterior[i] ?? undefined,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <Tooltip
                    formatter={(v: number, name: string) => [fmt(v), name === "receita" ? "Período atual" : "Período anterior"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  {chartReceitaAnterior.length > 0 && (
                    <Area type="monotone" dataKey="anterior" stroke="#94a3b8" strokeWidth={1.5}
                      strokeDasharray="4 4" fill="url(#gradAnterior)" dot={false} />
                  )}
                  <Area type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2.5}
                    fill="url(#gradReceita)" dot={{ r: 4, fill: "#22c55e" }} />
                </AreaChart>
              </ResponsiveContainer>
              {chartReceitaAnterior.length > 0 && (
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-0.5 bg-green-500 rounded" />
                    <span>Período atual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-0.5 bg-slate-400 rounded border-dashed" style={{ borderTop: "2px dashed #94a3b8", background: "none" }} />
                    <span>Período anterior</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Temperatura dos leads */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="w-4 h-4 text-muted-foreground" />
                Temperatura dos Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={tempData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                    paddingAngle={3} dataKey="value">
                    {tempData.map((_, i) => <Cell key={i} fill={TEMP_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {[
                  { label: "Frio ❄️",   color: TEMP_COLORS[0], idx: 0 },
                  { label: "Morno ⛅",  color: TEMP_COLORS[1], idx: 1 },
                  { label: "Quente 🔥", color: TEMP_COLORS[2], idx: 2 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tempData[item.idx].value}</span>
                      <span className="text-xs text-muted-foreground">{tempData[item.idx].pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Leads captados ao longo do tempo ────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-muted-foreground" />
              Captação de Leads — {chartTitle.replace("Receita — ", "")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartLeads} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, "Leads captados"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#gradLeads)" dot={{ r: 4, fill: "#3b82f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Ranking Corretores + Imóveis mais visitados ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Ranking de Corretores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="w-4 h-4 text-amber-500" />
                Ranking de Corretores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingCorretores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Users className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum gestor cadastrado nos leads</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rankingCorretores.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      {/* Medal */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0",
                        i === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        : i === 1 ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        : i === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
                        : "bg-muted text-muted-foreground"
                      )}>
                        {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                      </div>
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                        flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(c.name)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{c.leads} lead{c.leads !== 1 ? "s" : ""}</span>
                          <span className="text-green-500 font-medium">{c.vendas} venda{c.vendas !== 1 ? "s" : ""}</span>
                          <span>{c.conv}% conv.</span>
                        </div>
                      </div>
                      {/* Receita */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-green-500">{fmtCompact(c.receita)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Imóveis mais visitados */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Imóveis Mais Visitados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imoveisMaisVisitados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Building2 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma visita registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {imoveisMaisVisitados.map((im, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{im.titulo}</p>
                          <p className="text-xs text-muted-foreground">{im.tipo ?? "Imóvel"}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-bold">{im.visitas}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-700"
                          style={{ width: `${(im.visitas / maxVisitas) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Vendas por Status + Mapa de calor ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Vendas por status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4 text-muted-foreground" />
                Vendas por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendasPorStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma venda registrada</p>
              ) : (
                <div className="space-y-3">
                  {vendasPorStatus.map(vs => {
                    const max = vendasPorStatus[0].count;
                    return (
                      <div key={vs.status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{vs.status}</span>
                          <span className="font-bold" style={{ color: statusColor[vs.status] ?? "#94a3b8" }}>
                            {vs.count}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(vs.count / max) * 100}%`,
                              backgroundColor: statusColor[vs.status] ?? "#94a3b8",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mapa de calor de atividade */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Atividade — Últimos 84 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 flex-wrap">
                {heatmap.map((day, i) => (
                  <div
                    key={i}
                    title={`${day.date}: ${day.count} atividade${day.count !== 1 ? "s" : ""}`}
                    className={cn("w-3.5 h-3.5 rounded-sm cursor-default transition-colors", activityColor(day.count))}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-1">
                  {["bg-muted", "bg-green-200 dark:bg-green-900/60", "bg-green-400 dark:bg-green-700/80", "bg-green-600 dark:bg-green-500"].map((c, i) => (
                    <div key={i} className={cn("w-3 h-3 rounded-sm", c)} />
                  ))}
                </div>
                <span>Mais</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Leads hoje",   value: heatmap[heatmap.length - 1]?.count ?? 0, color: "text-blue-500" },
                  { label: "Ativo semana", value: heatmap.slice(-7).reduce((s, d) => s + d.count, 0), color: "text-purple-500" },
                  { label: "Ativo total",  value: heatmap.reduce((s, d) => s + d.count, 0), color: "text-green-500" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg bg-muted/50 p-2">
                    <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom: Leads por status (bar) ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Pipeline de Leads — Distribuição por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={[
                  { stage: "Novo", count: leads.filter(l => l.status === "novo").length, fill: "#3b82f6" },
                  { stage: "Contato", count: leads.filter(l => l.status === "contato").length, fill: "#8b5cf6" },
                  { stage: "Visita", count: leads.filter(l => l.status === "Visista").length, fill: "#f59e0b" },
                  { stage: "Proposta", count: leads.filter(l => l.status === "Proposta").length, fill: "#f97316" },
                  { stage: "Desistiu", count: leads.filter(l => l.status === "desistiu").length, fill: "#ef4444" },
                  { stage: "Bolsão", count: leads.filter(l => l.status === "bolsao").length, fill: "#22c55e" },
                ]}
                barCategoryGap="30%"
              >
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, "Leads"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {[
                    "#3b82f6","#8b5cf6","#f59e0b","#f97316","#ef4444","#22c55e"
                  ].map((color, i) => <Cell key={i} fill={color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
