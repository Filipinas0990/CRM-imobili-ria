import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";
import {
  Wallet,
  Users,
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { getDashboardStats } from "../integrations/supabase/dashoboard/integrations/supabase/dashboard/getDashboardStats";
import { getUpcomingVisits } from "../integrations/supabase/dashoboard/integrations/supabase/dashboard/getUpcomingVisits";
import { getVendas } from "@/integrations/supabase/vendas/getVendas";
import { getSaldoFinanceiro } from "@/integrations/supabase/Financeiros/getSaldoFinanceiro";
import { getLeads } from "@/integrations/supabase/leads/getLeads";

// Etapas espelhando exatamente o Kanban (PipelineLeads.tsx)
const ETAPAS = [
  { id: "novo", title: "Leads Novos", color: "bg-blue-500" },
  { id: "contato", title: "Em Contato", color: "bg-yellow-500" },
  { id: "Visista", title: "Visita Marcada", color: "bg-orange-500" },
  { id: "Proposta", title: "Proposta Enviada", color: "bg-green-600" },
  { id: "desistiu", title: "Cliente Desistiu", color: "bg-red-500" },
];

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    totalLeads: 0,
    totalProperties: 0,
    totalDeals: 0,
  });
  const [vendas, setVendas] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<any[]>([]);
  const [saldoFinanceiro, setSaldoFinanceiro] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [stats, visits, vendasData, leadsData, saldo] = await Promise.all([
          getDashboardStats(),
          getUpcomingVisits(),
          getVendas(),
          getLeads(),
          getSaldoFinanceiro(),
        ]);

        setStatsData(stats);
        setUpcomingVisits(visits);
        setVendas(vendasData || []);
        setLeads(leadsData || []);
        setSaldoFinanceiro(saldo);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalDeals = vendas.filter((v) => v.status === "Fechada").length;
  const totalLeadsGeral = leads.length > 0 ? leads.length : 1; // evita divisão por zero

  const stats = [
    {
      title: "Total de Leads",
      value: statsData.totalLeads,
      change: "Total cadastrado",
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "Imóveis Cadastrados",
      value: statsData.totalProperties,
      change: "Total cadastrado",
      icon: Building2,
      color: "text-chart-2",
    },
    {
      title: "Saldo em Caixa",
      value: saldoFinanceiro.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
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
        <main className="ml-16 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Carregando dashboard...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="ml-16 w-full overflow-y-auto">
        <div className="p-8">

          {/* HEADER */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Bem-vindo ao seu painel de controle
              </p>
            </div>
            <LogoutButton />
          </div>

          {/* CARDS DE STATS */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* FUNIL DE VENDAS */}
            <Card>
              <CardHeader>
                <CardTitle>Funil de Vendas</CardTitle>
                <CardDescription>
                  Distribuição dos leads por etapa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ETAPAS.map((etapa) => {
                  const count = leads.filter(
                    (l) => l.status === etapa.id
                  ).length;
                  const percent = Math.round(
                    (count / totalLeadsGeral) * 100
                  );

                  return (
                    <div key={etapa.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {etapa.title}
                        </span>
                        <span className="text-sm text-muted-foreground">
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

                {/* Totalizador */}
                <div className="pt-3 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Total de leads no funil</span>
                  <span className="font-semibold text-foreground">
                    {leads.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* PRÓXIMAS VISITAS */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Visitas</CardTitle>
                <CardDescription>Suas visitas agendadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma visita agendada.
                  </p>
                ) : (
                  upcomingVisits.map((visit, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-3 py-2 min-w-[60px]">
                        <span className="text-xs font-medium text-primary">
                          {visit.date}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {visit.time}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-sm font-medium">{visit.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {visit.location}
                        </p>
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