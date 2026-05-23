import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";
import { useAuthStore } from "@/store/auth.store";
import {
  Users, Building2, CheckCircle2, CalendarCheck,
  TrendingUp, Flame, Thermometer, Snowflake,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/services/lead.service";
import { vendaService } from "@/services/venda.service";
import { visitaService } from "@/services/visita.service";
import { imovelService } from "@/services/imovel.service";
import {
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const STALE = 1000 * 60 * 5;

const ETAPAS = [
  { id: "novo",     title: "Leads Novos",      bar: "bg-blue-500" },
  { id: "contato",  title: "Em Contato",        bar: "bg-yellow-500" },
  { id: "Visista",  title: "Visita Marcada",    bar: "bg-orange-500" },
  { id: "Proposta", title: "Proposta Enviada",  bar: "bg-green-600" },
  { id: "desistiu", title: "Cliente Desistiu",  bar: "bg-red-500" },
];

const TEMP_CONFIG = [
  { label: "Quente", value: 3, color: "#ef4444", icon: Flame },
  { label: "Morno",  value: 2, color: "#f59e0b", icon: Thermometer },
  { label: "Frio",   value: 1, color: "#3b82f6", icon: Snowflake },
];

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = (user?.name || "").split(" ")[0] || "Corretor";

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadService.getAll(),
    staleTime: STALE,
  });

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => vendaService.getAll(),
    staleTime: STALE,
  });

  const { data: visitas = [], isLoading: loadingVisitas } = useQuery({
    queryKey: ["visitas"],
    queryFn: () => visitaService.getAll(),
    staleTime: STALE,
  });

  const { data: imoveis = [], isLoading: loadingImoveis } = useQuery({
    queryKey: ["imoveis"],
    queryFn: () => imovelService.getAll(),
    staleTime: STALE,
  });

  const loading = loadingLeads || loadingVendas || loadingVisitas || loadingImoveis;

  // ── CÁLCULOS ──
  const vendasFechadas = vendas.filter((v) => v.status === "Fechada");
  const receitaTotal = vendasFechadas.reduce((s, v) => s + (v.valor || 0), 0);

  const hojeStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" local-safe

  const visitasFuturas = visitas.filter((v) => {
    const dataStr = (v.data ?? "").slice(0, 10); // pega só "YYYY-MM-DD"
    return (v.status === "agendada" || v.status === "confirmada") && dataStr >= hojeStr;
  });

  const proximasVisitas = visitasFuturas
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5)
    .map((v) => {
      const lead = leads.find((l) => l.id === v.lead_id);
      const imovel = imoveis.find((i) => i.id === v.imovel_id);
      return {
        ...v,
        clienteNome: v.lead?.name ?? v.clienteNome ?? lead?.name ?? "Cliente",
        imovelNome: v.imovel?.titulo ?? v.imovelNome ?? imovel?.titulo ?? "Imóvel",
      };
    });

  const totalLeadsGeral = leads.filter((l) => l.status !== "bolsao").length || 1;

  const tempData = TEMP_CONFIG.map((t) => ({
    name: t.label,
    value: leads.filter((l) => l.temperatura === t.value).length,
    color: t.color,
  })).filter((t) => t.value > 0);

  // Receita acumulada por mês
  const receitaMap: Record<string, number> = {};
  vendasFechadas.forEach((v) => {
    const key = getMonthKey(v.data_venda || v.created_at);
    receitaMap[key] = (receitaMap[key] || 0) + (v.valor || 0);
  });
  const receitaData = Object.entries(receitaMap)
    .sort((a, b) => {
      const parse = (s: string) => {
        const months: Record<string, number> = {
          jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
          jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
        };
        const [m, y] = s.split(" ");
        return new Date(2000 + parseInt(y), months[m] ?? 0).getTime();
      };
      return parse(a[0]) - parse(b[0]);
    })
    .map(([mes, receita]) => ({ mes, receita }));

  const kpis = [
    {
      title: "Total de Leads",
      value: leads.filter((l) => l.status !== "bolsao").length,
      sub: `${leads.filter((l) => l.status === "novo").length} novos`,
      icon: Users,
      gradient: "from-purple-500 to-purple-700",
      bg: "bg-purple-50 dark:bg-purple-950",
      text: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Imóveis Cadastrados",
      value: imoveis.length,
      sub: `${imoveis.filter((i) => i.status === "Disponível").length} disponíveis`,
      icon: Building2,
      gradient: "from-blue-500 to-blue-700",
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Vendas Fechadas",
      value: vendasFechadas.length,
      sub: formatCurrency(receitaTotal),
      icon: CheckCircle2,
      gradient: "from-green-500 to-green-700",
      bg: "bg-green-50 dark:bg-green-950",
      text: "text-green-600 dark:text-green-400",
    },
    {
      title: "Visitas Agendadas",
      value: visitasFuturas.length,
      sub: "Próximas confirmadas",
      icon: CalendarCheck,
      gradient: "from-orange-500 to-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
      text: "text-orange-600 dark:text-orange-400",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="md:ml-16 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 w-full overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground capitalize mb-1">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return <>Bom dia, <span className="text-primary">{firstName}!</span></>;
                  if (h < 18) return <>Boa tarde, <span className="text-primary">{firstName}!</span></>;
                  return <>Boa noite, <span className="text-primary">{firstName}!</span></>;
                })()}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Aqui está o resumo do seu negócio hoje.
              </p>
            </div>
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {kpis.map((kpi, i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className={`h-1.5 bg-gradient-to-r ${kpi.gradient}`} />
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-5 h-5 ${kpi.text}`} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                    <p className={`text-xs font-medium mt-1 ${kpi.text}`}>{kpi.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── FUNIL + TEMPERATURA ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Funil de Leads */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Funil de Leads
                </CardTitle>
                <p className="text-xs text-muted-foreground">Distribuição por etapa do pipeline</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {ETAPAS.map((etapa) => {
                  const count = leads.filter((l) => l.status === etapa.id).length;
                  const percent = Math.round((count / totalLeadsGeral) * 100);
                  return (
                    <div key={etapa.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{etapa.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} lead{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${etapa.bar} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Total de leads no funil</span>
                  <span className="font-semibold text-foreground">{leads.filter((l) => l.status !== "bolsao").length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Temperatura dos Leads */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Temperatura
                </CardTitle>
                <p className="text-xs text-muted-foreground">Qualificação dos leads</p>
              </CardHeader>
              <CardContent>
                {tempData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    Sem dados de temperatura
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={tempData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {tempData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} leads`, ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {TEMP_CONFIG.map((t) => {
                        const count = leads.filter((l) => l.temperatura === t.value).length;
                        const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                        return (
                          <div key={t.value} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                              <span className="text-xs text-muted-foreground">{t.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">{count}</span>
                              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RECEITA + VISITAS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Receita acumulada */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Receita de Vendas
                </CardTitle>
                <p className="text-xs text-muted-foreground">Valor das vendas fechadas por mês</p>
              </CardHeader>
              <CardContent>
                {receitaData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    Nenhuma venda fechada ainda
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={receitaData} margin={{ left: 10, right: 10 }}>
                      <defs>
                        <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1653cc" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1653cc" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v: number) => [formatCurrency(v), "Receita"]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        stroke="#1653cc"
                        strokeWidth={2.5}
                        fill="url(#receitaGradient)"
                        dot={{ fill: "#1653cc", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Próximas Visitas */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-orange-500" />
                  Próximas Visitas
                </CardTitle>
                <p className="text-xs text-muted-foreground">Visitas agendadas</p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {proximasVisitas.length === 0 ? (
                  <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                    Nenhuma visita agendada
                  </div>
                ) : (
                  proximasVisitas.map((v, i) => {
                    const d = new Date(v.data);
                    const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                    const semana = d.toLocaleDateString("pt-BR", { weekday: "short" });
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                        <div className="flex flex-col items-center justify-center bg-orange-100 dark:bg-orange-950 rounded-lg px-2.5 py-2 min-w-[48px]">
                          <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 capitalize">{semana}</span>
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{dia}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {v.clienteNome}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {v.imovelNome}
                          </p>
                          {v.horario && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{v.horario}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
