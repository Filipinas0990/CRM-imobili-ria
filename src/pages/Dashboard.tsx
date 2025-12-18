import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";

import { getDashboardStats } from "../integrations/supabase/dashoboard/integrations/supabase/dashboard/getDashboardStats";
import { getRecentActivities } from "../integrations/supabase/dashoboard/integrations/supabase/dashboard/getRecentActivities";
import { getUpcomingVisits } from "../integrations/supabase/dashoboard/integrations/supabase/dashboard/getUpcomingVisits";
import {getConversionRate } from "../integrations/supabase/dashoboard/integrations/supabase/dashboard/getConversionRate";

import { 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    totalLeads: 0,
    totalProperties: 0,
    totalDeals: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const stats = await getDashboardStats();
        const activities = await getRecentActivities();
        const visits = await getUpcomingVisits();
      

        setStatsData(stats);
        setRecentActivities(activities);
        setUpcomingVisits(visits);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      }
    }

    loadDashboard();
  }, []);

  const conversionRate =
    statsData.totalLeads > 0
      ? Math.round((statsData.totalDeals / statsData.totalLeads) * 100)
      : 0;

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
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      change: "Base geral",
      icon: TrendingUp,
      color: "text-chart-3",
    },
    {
      title: "Negócios Fechados",
      value: statsData.totalDeals,
      change: "Total",
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="ml-16 w-full overflow-y-auto">
        <div className="p-8">
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

          {/* STATS */}
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
            {/* ÚLTIMAS ATIVIDADES */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Atividades</CardTitle>
                <CardDescription>
                  Acompanhe as ações mais recentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* PRÓXIMAS VISITAS */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Visitas</CardTitle>
                <CardDescription>
                  Suas visitas agendadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingVisits.map((visit, index) => (
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
                    <div>
                      <p className="text-sm font-medium">{visit.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {visit.location}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
