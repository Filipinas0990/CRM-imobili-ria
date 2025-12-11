import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Bell, 
  LayoutDashboard, 
  DollarSign, 
  Calendar, 
  BarChart3,
  Target,
  Users,
  Building2,
  FileCheck,
  ClipboardList,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumente sua taxa de conversão",
      description: "Gerencie seus leads de forma inteligente e converta mais oportunidades em vendas"
    },
    {
      icon: Bell,
      title: "Alertas automáticos",
      description: "Nunca perca prazos importantes com notificações inteligentes e lembretes"
    },
    {
      icon: LayoutDashboard,
      title: "Gestão completa",
      description: "Tenha controle total sobre leads, imóveis, visitas e vendas em um só lugar"
    },
    {
      icon: DollarSign,
      title: "Controle financeiro integrado",
      description: "Acompanhe comissões, despesas e receitas com relatórios detalhados"
    },
    {
      icon: Calendar,
      title: "Agenda inteligente",
      description: "Organize suas visitas e compromissos com sincronização automática"
    },
    {
      icon: BarChart3,
      title: "Relatórios e BI",
      description: "Dashboards visuais com métricas importantes para sua tomada de decisão"
    }
  ];

  const features = [
    {
      icon: Users,
      title: "Gestão de Leads",
      description: "Cadastre, organize e acompanhe todos os seus leads em um funil visual completo"
    },
    {
      icon: Building2,
      title: "Gestão de Imóveis",
      description: "Cadastre imóveis com fotos, detalhes e documentação completa"
    },
    {
      icon: DollarSign,
      title: "Gestão Financeira",
      description: "Controle vendas, despesas, comissões e fluxo de caixa"
    },
    {
      icon: Calendar,
      title: "Agenda e Visitas",
      description: "Registre visitas, agende compromissos e receba lembretes automáticos"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Gráficos e dashboards com análise de desempenho e conversão"
    },
    {
      icon: Target,
      title: "Sistema de Metas",
      description: "Defina e acompanhe metas mensais e anuais com indicadores visuais"
    },
    {
      icon: CheckCircle2,
      title: "Pós-venda",
      description: "Mantenha relacionamento com clientes e gere novas indicações"
    },
    {
      icon: Bell,
      title: "Alertas Importantes",
      description: "Receba avisos de documentos, assinaturas e pendências importantes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              CRM Completo para Corretores de Imóveis
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
              Gerencie leads, imóveis, visitas e vendas em uma plataforma moderna e intuitiva
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Testar gratuitamente
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Por que escolher nosso CRM?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Desenvolvido especialmente para corretores que querem vender mais e melhor
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Funcionalidades completas
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar seu negócio imobiliário
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-accent">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Pronto para transformar suas vendas?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Comece a usar gratuitamente e veja seus resultados crescerem
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6"
            onClick={() => navigate("/auth")}
          >
            Testar gratuitamente
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm opacity-90">
            © 2024 CRM Imóveis. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
