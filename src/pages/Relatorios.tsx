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

      <main className="flex-1 ml-20 p-8 space-y-8 overflow-y-auto">

        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Página em Desenvolvimento!</h1>
            <p className="text-muted-foreground mt-2">
              Estamos Trabalhando o máximo para trazer esta funcionalidade em breve.
            </p>
          </div>
        </div>
      </main>
      /</div>



  );
};

export default Relatorios;
