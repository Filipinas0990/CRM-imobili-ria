import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import LogoutButton from "@/components/LogoutButton";
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
  const stats = [
    {
      title: "Total de Leads",
      value: "124",
      change: "+12% este mês",
      icon: Users,
      color: "text-chart-1"
    },
    {
      title: "Imóveis Cadastrados",
      value: "48",
      change: "+3 novos",
      icon: Building2,
      color: "text-chart-2"
    },
    {
      title: "Taxa de Conversão",
      value: "32%",
      change: "+5% este mês",
      icon: TrendingUp,
      color: "text-chart-3"
    },
    {
      title: "Negócios Fechados",
      value: "18",
      change: "Este mês",
      icon: CheckCircle2,
      color: "text-success"
    }
  ];

  const recentActivities = [
    {
      title: "Novo lead cadastrado",
      description: "João Silva - Interessado em apartamento",
      time: "Há 5 minutos",
      icon: Users
    },
    {
      title: "Visita agendada",
      description: "Maria Santos - Apartamento Jardim Paulista",
      time: "Há 1 hora",
      icon: Calendar
    },
    {
      title: "Proposta enviada",
      description: "Carlos Oliveira - Casa Morumbi",
      time: "Há 2 horas",
      icon: FileText
    },
    {
      title: "Venda concluída",
      description: "Ana Costa - Apartamento Vila Mariana - R$ 850.000",
      time: "Há 3 horas",
      icon: DollarSign
    }
  ];

  const upcomingVisits = [
    {
      time: "14:00",
      client: "Roberto Mendes",
      property: "Apartamento 3 dorms - Itaim Bibi",
      date: "Hoje"
    },
    {
      time: "16:30",
      client: "Juliana Costa",
      property: "Casa 4 dorms - Morumbi",
      date: "Hoje"
    },
    {
      time: "10:00",
      client: "Pedro Santos",
      property: "Cobertura - Jardins",
      date: "Amanhã"
    }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Bem-vindo ao seu painel de controle</p>
            </div>
            <LogoutButton />
          </div>

          {/* Stats Grid */}
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
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Atividades</CardTitle>
                <CardDescription>Acompanhe as ações mais recentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <activity.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Visits */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Visitas</CardTitle>
                <CardDescription>Suas visitas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingVisits.map((visit, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-3 py-2 min-w-[60px]">
                        <span className="text-xs font-medium text-primary">{visit.date}</span>
                        <span className="text-lg font-bold text-primary">{visit.time}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">{visit.client}</p>
                        <p className="text-sm text-muted-foreground">{visit.property}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
