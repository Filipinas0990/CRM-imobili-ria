import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Mail, Building2, UserPlus, ArrowRight,
  TrendingUp, DollarSign, Eye, Medal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STALE = 1000 * 60 * 5;

const fmt = (v: string | number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const DashboardImobiliaria = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ["org-dashboard"],
    queryFn: orgService.getDashboard,
    staleTime: STALE,
  });

  const { data: convites = [], isLoading: loadingConvites } = useQuery({
    queryKey: ["org-invites"],
    queryFn: orgService.getInvites,
    staleTime: STALE,
  });

  const loading = loadingDash || loadingConvites;
  const totals = dashboard?.totals;
  const members = dashboard?.members ?? [];
  const pendentes = convites.filter((c) => c.status === "pendente");

  const kpis = [
    {
      title: "Leads da equipe",
      value: totals?.leads ?? "—",
      icon: Users,
      gradient: "from-blue-500 to-blue-700",
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-600 dark:text-blue-400",
      href: "/imobiliaria/equipe/leads",
    },
    {
      title: "Vendas da equipe",
      value: totals?.vendas ?? "—",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-700",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      text: "text-emerald-600 dark:text-emerald-400",
      href: "/imobiliaria/equipe/vendas",
    },
    {
      title: "Valor vendido",
      value: totals ? fmt(totals.valor_total) : "—",
      icon: DollarSign,
      gradient: "from-purple-500 to-purple-700",
      bg: "bg-purple-50 dark:bg-purple-950",
      text: "text-purple-600 dark:text-purple-400",
      href: "/imobiliaria/equipe/vendas",
    },
    {
      title: "Visitas marcadas",
      value: totals?.visitas ?? "—",
      icon: Eye,
      gradient: "from-amber-400 to-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-600 dark:text-amber-400",
      href: "/imobiliaria/pipeline",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="md:ml-16 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando painel...</p>
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

          {/* HEADER */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                {(() => {
                  const h = new Date().getHours();
                  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
                })()}, {user?.name?.split(" ")[0]}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                Painel da Imobiliária
              </h1>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>

            <button
              onClick={() => navigate("/imobiliaria/convites")}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Convidar corretor
            </button>
          </div>

          {/* KPI CARDS — performance da equipe */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {kpis.map((kpi) => (
              <Card
                key={kpi.title}
                className="overflow-hidden border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(kpi.href)}
              >
                <CardContent className="p-0">
                  <div className={`h-1.5 bg-gradient-to-r ${kpi.gradient}`} />
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-5 h-5 ${kpi.text}`} />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* RANKING DA EQUIPE */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-500" />
                  Ranking da equipe
                </CardTitle>
                <button
                  onClick={() => navigate("/imobiliaria/equipe/leads")}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Ver leads →
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Ordenado por valor vendido</p>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="h-[120px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Users className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Nenhum corretor com atividade ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Cabeçalho */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Corretor</span>
                    <span className="text-center">Leads</span>
                    <span className="text-center">Visitas</span>
                    <span className="text-center">Vendas</span>
                    <span className="text-right">Valor vendido</span>
                  </div>
                  {members.map((m, i) => (
                    <div
                      key={m.id}
                      className="grid grid-cols-[auto_1fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center p-3 rounded-xl bg-muted/40 border border-border"
                    >
                      {/* Mobile: avatar + nome + stats inline */}
                      <div className="flex items-center gap-3 md:contents">
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          {i === 0 && (
                            <span className="absolute -top-1 -right-1 text-base leading-none">🥇</span>
                          )}
                          {i === 1 && (
                            <span className="absolute -top-1 -right-1 text-base leading-none">🥈</span>
                          )}
                          {i === 2 && (
                            <span className="absolute -top-1 -right-1 text-base leading-none">🥉</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 md:hidden">
                          <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.leads} leads · {m.vendas} vendas · {fmt(m.valor_vendas)}
                          </p>
                        </div>

                        {/* Desktop: colunas separadas */}
                        <div className="hidden md:block min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                        <p className="hidden md:block text-sm font-medium text-foreground text-center">{m.leads}</p>
                        <p className="hidden md:block text-sm font-medium text-foreground text-center">{m.visitas}</p>
                        <p className="hidden md:block text-sm font-medium text-foreground text-center">{m.vendas}</p>
                        <p className="hidden md:block text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">{fmt(m.valor_vendas)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AÇÕES RÁPIDAS */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Ações rápidas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Pipeline da equipe", icon: TrendingUp, href: "/imobiliaria/pipeline", color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Leads da equipe", icon: Users, href: "/imobiliaria/equipe/leads", color: "text-indigo-500", bg: "bg-indigo-500/10" },
                { label: "Vendas da equipe", icon: DollarSign, href: "/imobiliaria/equipe/vendas", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Convidar corretor", icon: UserPlus, href: "/imobiliaria/convites", color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Minha imobiliária", icon: Building2, href: "/imobiliaria/perfil", color: "text-purple-500", bg: "bg-purple-500/10" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.href)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-all text-center group"
                >
                  <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{a.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* CONVITES PENDENTES (resumo) */}
          {pendentes.length > 0 && (
            <Card className="shadow-sm border-amber-200 dark:border-amber-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {pendentes.length} {pendentes.length === 1 ? "convite pendente" : "convites pendentes"}
                  </p>
                  <p className="text-xs text-muted-foreground">Corretores ainda não aceitaram o convite</p>
                </div>
                <button
                  onClick={() => navigate("/imobiliaria/convites")}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex-shrink-0"
                >
                  Ver →
                </button>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default DashboardImobiliaria;
