import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Mail, Building2, UserPlus, Clock,
  CheckCircle2, ArrowRight, UserCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STALE = 1000 * 60 * 5;

const DashboardImobiliaria = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: membros = [], isLoading: loadingMembros } = useQuery({
    queryKey: ["org-members"],
    queryFn: orgService.getMembers,
    staleTime: STALE,
  });

  const { data: convites = [], isLoading: loadingConvites } = useQuery({
    queryKey: ["org-invites"],
    queryFn: orgService.getInvites,
    staleTime: STALE,
  });

  const pendentes = convites.filter((c) => c.status === "pendente");
  const aceitos   = convites.filter((c) => c.status === "aceito");

  const loading = loadingMembros || loadingConvites;

  const kpis = [
    {
      title: "Corretores ativos",
      value: membros.length,
      sub: `${aceitos.length} entraram via convite`,
      icon: Users,
      gradient: "from-blue-500 to-blue-700",
      bg: "bg-blue-50 dark:bg-blue-950",
      text: "text-blue-600 dark:text-blue-400",
      href: "/imobiliaria/corretores",
    },
    {
      title: "Convites pendentes",
      value: pendentes.length,
      sub: `${convites.length} enviados no total`,
      icon: Mail,
      gradient: "from-amber-400 to-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-600 dark:text-amber-400",
      href: "/imobiliaria/convites",
    },
    {
      title: "Total de convites",
      value: convites.length,
      sub: `${aceitos.length} aceitos`,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-emerald-700",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      text: "text-emerald-600 dark:text-emerald-400",
      href: "/imobiliaria/convites",
    },
    {
      title: "Minha imobiliária",
      value: "—",
      sub: "Ver e editar perfil",
      icon: Building2,
      gradient: "from-purple-500 to-purple-700",
      bg: "bg-purple-50 dark:bg-purple-950",
      text: "text-purple-600 dark:text-purple-400",
      href: "/imobiliaria/perfil",
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

          {/* ── HEADER ── */}
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

          {/* ── KPI CARDS ── */}
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
                    <p className={`text-xs font-medium mt-1 ${kpi.text}`}>{kpi.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── CORRETORES + CONVITES PENDENTES ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

            {/* Lista de corretores */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Corretores
                  </CardTitle>
                  <button
                    onClick={() => navigate("/imobiliaria/corretores")}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    Ver todos
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Equipe vinculada à imobiliária</p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {membros.length === 0 ? (
                  <div className="h-[160px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <UserCircle2 className="w-9 h-9 opacity-30" />
                    <div className="text-center">
                      <p className="text-sm">Nenhum corretor ainda</p>
                      <button
                        onClick={() => navigate("/imobiliaria/convites")}
                        className="text-xs text-blue-500 hover:underline mt-1"
                      >
                        Convidar agora →
                      </button>
                    </div>
                  </div>
                ) : (
                  membros.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm flex-shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize flex-shrink-0">
                        {m.role}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Convites pendentes */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Convites pendentes
                  </CardTitle>
                  <button
                    onClick={() => navigate("/imobiliaria/convites")}
                    className="text-xs text-amber-500 hover:text-amber-600 font-medium transition-colors"
                  >
                    Gerenciar
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Aguardando resposta dos corretores</p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {pendentes.length === 0 ? (
                  <div className="h-[160px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Mail className="w-9 h-9 opacity-30" />
                    <div className="text-center">
                      <p className="text-sm">Nenhum convite pendente</p>
                      <button
                        onClick={() => navigate("/imobiliaria/convites")}
                        className="text-xs text-amber-500 hover:underline mt-1"
                      >
                        Enviar convite →
                      </button>
                    </div>
                  </div>
                ) : (
                  pendentes.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviado em {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        Pendente
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── AÇÕES RÁPIDAS ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Ações rápidas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Convidar corretor",
                  desc: "Gerar link de convite",
                  icon: UserPlus,
                  href: "/imobiliaria/convites",
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Ver corretores",
                  desc: "Gerenciar equipe",
                  icon: Users,
                  href: "/imobiliaria/corretores",
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Minha imobiliária",
                  desc: "Editar dados da empresa",
                  icon: Building2,
                  href: "/imobiliaria/perfil",
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.href)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-border/80 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DashboardImobiliaria;
