import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, PieChart, FileText, TrendingUp } from "lucide-react";

const Relatorios = () => {
  const reports = [
    {
      title: "Leads por Status",
      description: "Distribuição de leads entre novo, contato e negociação",
      icon: PieChart,
    },
    {
      title: "Vendas no Mês",
      description: "Resumo das vendas concluídas no período atual",
      icon: TrendingUp,
    },
    {
      title: "Desempenho de Corretores",
      description: "Comparativo entre captação, visitas e conversões",
      icon: BarChart3,
    },
    {
      title: "Exportar Relatórios",
      description: "Baixe relatórios completos em PDF ou Excel",
      icon: FileText,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-2">
              Análises e relatórios de desempenho
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <Card
                key={index}
                className="hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  <report.icon className="w-6 h-6 text-primary" />
                  <CardTitle>{report.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {report.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Relatorios;
