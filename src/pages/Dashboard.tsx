import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";
import { Wallet, Users, Building2, CheckCircle2 } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { getDashboardStats } from "@/integrations/supabase/dashoboard/getDashboardStats";
import { getUpcomingVisits } from "@/integrations/supabase/dashoboard/getUpcomingVisits";
import { getVendas } from "@/integrations/supabase/vendas/getVendas";
import { getSaldoFinanceiro } from "@/integrations/supabase/Financeiros/getSaldoFinanceiro";
import { getLeads } from "@/integrations/supabase/leads/getLeads";

const ETAPAS = [
  { id: "novo", title: "Leads Novos", color: "bg-blue-500" },
  { id: "contato", title: "Em Contato", color: "bg-yellow-500" },
  { id: "Visista", title: "Visita Marcada", color: "bg-orange-500" },
  { id: "Proposta", title: "Proposta Enviada", color: "bg-green-600" },
  { id: "desistiu", title: "Cliente Desistiu", color: "bg-red-500" },
];

const STALE = 1000 * 60 * 5; // 5 minutos

const Dashboard = () => {
  // ✅ React Query — cada fetch tem seu cache independente
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    staleTime: STALE,
  });

  const { data: upcomingVisits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ["upcoming-visits"],
    queryFn: getUpcomingVisits,
    staleTime: STALE,
  });

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ["vendas"],
    queryFn: getVendas,
    staleTime: STALE,
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],           // ✅ mesma queryKey que Leads.tsx — compartilha o cache!
    queryFn: getLeads,
    staleTime: STALE,
  });

  const { data: saldoFinanceiro = 0, isLoading: loadingSaldo } = useQuery({
    queryKey: ["saldo-financeiro"],
    queryFn: getSaldoFinanceiro,
    staleTime: STALE,
  });

  const loading =
    loadingStats || loadingVisits || loadingVendas || loadingLeads || loadingSaldo;

  const totalDeals = vendas.filter((v) => v.status === "Fechada").length;
  const totalLeadsGeral = leads.length > 0 ? leads.length : 1;

  const stats = [
    {
      title: "Total de Leads",
      value: statsData?.totalLeads ?? 0,
      change: "Total cadastrado",
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "Imóveis Cadastrados",
      value: statsData?.totalProperties ?? 0,
      change: "Total cadastrado",
      icon: Building2,
      color: "text-chart-2",
    },
    {
      title: "Saldo em Caixa",
      value: saldoFinanceiro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      change: "Financeiro",
      icon: Wallet,
      color: "text-success",
    },
    {
      title: "Negócios Fechados",
      value: totalDeals,
      change: "Total",
      icon: CheckCircle2,
      color: "text-success",
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
        <div className="p-4 md:p-8">

          {/* ── HEADER ── */}
          <div className="mb-6 md:mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo ao seu painel de controle
              </p>
            </div>
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>

          {/* ── CARDS DE STATS ── */}
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4 mb-6 md:mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-3 Pb-0">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 flex-shrink-0 ${stat.color}`} />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-3xl font-bold text-foreground truncate">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── FUNIL + VISITAS ── */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">

            {/* FUNIL DE VENDAS */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Funil de Vendas</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Distribuição dos leads por etapa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                {ETAPAS.map((etapa) => {
                  const count = leads.filter((l) => l.status === etapa.id).length;
                  const percent = Math.round((count / totalLeadsGeral) * 100);
                  return (
                    <div key={etapa.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs md:text-sm font-medium">{etapa.title}</span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                          {count} lead{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${etapa.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Total de leads no funil</span>
                  <span className="font-semibold text-foreground">{leads.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* PRÓXIMAS VISITAS */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Próximas Visitas</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Suas visitas agendadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                {upcomingVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma visita agendada.</p>
                ) : (
                  upcomingVisits.map((visit, index) => (
                    <div key={index} className="flex gap-3 md:gap-4 p-3 rounded-lg border bg-card">
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-2 md:px-3 py-2 min-w-[56px] md:min-w-[60px]">
                        <span className="text-[10px] md:text-xs font-medium text-primary">{visit.date}</span>
                        <span className="text-base md:text-lg font-bold text-primary">{visit.time}</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-sm font-medium">{visit.title}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{visit.location}</p>
                      </div>
                    </div>
                  ))
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