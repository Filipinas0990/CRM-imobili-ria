import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
  CheckCircle2
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: TrendingUp,
      title: "Aumente sua taxa de conversão",
      description:
        "Gerencie seus leads de forma inteligente e converta mais oportunidades em vendas"
    },
    {
      icon: Bell,
      title: "Alertas automáticos",
      description:
        "Nunca perca prazos importantes com notificações inteligentes e lembretes"
    },
    {
      icon: LayoutDashboard,
      title: "Gestão completa",
      description:
        "Controle total sobre leads, imóveis, visitas e vendas em um só lugar"
    },
    {
      icon: DollarSign,
      title: "Controle financeiro integrado",
      description:
        "Acompanhe comissões, despesas e receitas com relatórios claros"
    },
    {
      icon: Calendar,
      title: "Agenda inteligente",
      description:
        "Organize compromissos com sincronização automática"
    },
    {
      icon: BarChart3,
      title: "Relatórios e BI",
      description:
        "Dashboards visuais para decisões rápidas"
    }
  ];

  const features = [
    { icon: Users, title: "Gestão de Leads", description: "Funil visual completo" },
    { icon: Building2, title: "Gestão de Imóveis", description: "Cadastro e documentação" },
    { icon: DollarSign, title: "Financeiro", description: "Fluxo de caixa e comissões" },
    { icon: Calendar, title: "Agenda", description: "Visitas e lembretes" },
    { icon: BarChart3, title: "Relatórios", description: "Análises de performance" },
    { icon: Target, title: "Metas", description: "Indicadores visuais" },
    { icon: CheckCircle2, title: "Pós-venda", description: "Relacionamento contínuo" },
    { icon: Bell, title: "Alertas", description: "Pendências críticas" }
  ];

  return (
    <div className="min-h-screen w-full">

      {/* HERO */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1F] via-[#0B1C3F] to-[#020617]" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.35),_transparent_60%)]" />

        <div className="relative container mx-auto max-w-7xl px-6 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              CRM inteligente <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                integrado com automações n8n
              </span>
            </h1>

            <p className="text-base md:text-xl text-white/80 max-w-xl mb-8">
              Menos cliques. Mais decisões automáticas. Controle total do seu negócio em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button
                size="lg"
                className="px-10 py-6 text-lg w-full sm:w-auto"
                onClick={() => navigate("/auth")}
              >
                Testar gratuitamente
              </Button>
              <span className="text-sm text-white/60">
                Automações sem código • Dados em tempo real
              </span>
            </div>
          </div>

          {/* MOCK VISUAL */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30" />
                <div className="h-24 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30" />
                <div className="h-24 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30" />
                <div className="h-24 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-pink-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS – FUNDO BRANCO */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">
            Por que escolher nosso CRM?
          </h2>
          <p className="text-center text-neutral-600 mb-12">
            Desenvolvido para quem quer escalar com tecnologia
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <Card
                key={i}
                className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition"
              >
                <CardHeader>
                  <b.icon className="w-8 h-8 text-green-600 mb-4" />
                  <CardTitle className="text-black text-lg">
                    {b.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-700">
                    {b.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* BLOCO AUTOMAÇÕES – DIFERENCIAL */}
<section className="py-20 px-6 bg-black text-white">
  <div className="container mx-auto max-w-5xl text-center">
    <h2 className="text-3xl md:text-4xl font-bold mb-6">
      Automação que trabalha por você
    </h2>

    <p className="text-base md:text-lg text-white/70 max-w-3xl mx-auto mb-10">
      Nosso CRM não apenas organiza dados. Ele executa ações automáticas,
      envia alertas, move etapas e integra sistemas sem esforço manual.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="border border-white/10 rounded-xl p-6">
        <p className="text-green-500 font-semibold mb-2">Eventos automáticos</p>
        <p className="text-white/70 text-sm">
          Ações disparadas por status, datas e comportamento do cliente
        </p>
      </div>

      <div className="border border-white/10 rounded-xl p-6">
        <p className="text-green-500 font-semibold mb-2">Integração com n8n</p>
        <p className="text-white/70 text-sm">
          Conecte WhatsApp, e-mail, planilhas, APIs e outros sistemas
        </p>
      </div>

      <div className="border border-white/10 rounded-xl p-6">
        <p className="text-green-500 font-semibold mb-2">Menos tarefas manuais</p>
        <p className="text-white/70 text-sm">
          O sistema executa processos repetitivos sozinho
        </p>
      </div>
    </div>
  </div>
</section>

      {/* FEATURES */}
      {/* FEATURES – FUNDO BRANCO */}
<section className="py-20 px-6 bg-white">
  <div className="container mx-auto max-w-6xl">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">
      Funcionalidades completas
    </h2>
    <p className="text-center text-neutral-600 mb-12">
      Tudo que você precisa em um único sistema
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((f, i) => (
        <Card
          key={i}
          className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition"
        >
          <CardHeader>
            <f.icon className="w-7 h-7 text-green-600 mb-4" />
            <CardTitle className="text-black text-base">
              {f.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-neutral-700">
              {f.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>

      {/* CTA */}
    {/* CTA – VERDE (IDENTIDADE DO CRM) */}
<section className="py-20 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-black">
  <div className="container mx-auto max-w-4xl text-center">
    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
      Seu CRM precisa pensar sozinho
    </h2>
    <p className="text-base md:text-lg mb-8 text-white/80">
      Automatize processos, elimine tarefas manuais e escale com inteligência
    </p>
    <Button
      size="lg"
      className="bg-white text-green-700 hover:bg-neutral-100 px-10 py-6 text-lg"
      onClick={() => navigate("/auth")}
    >
      Começar agora
    </Button>
  </div>
</section>
      <footer className="py-8 text-center text-Whit-500 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-black">
        © 2025 • CRM Inteligente
      </footer>
    </div>
  );
};

export default Landing;
