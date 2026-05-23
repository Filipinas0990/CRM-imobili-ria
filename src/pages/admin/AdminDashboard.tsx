import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Users, Star, AlertTriangle, RefreshCw } from "lucide-react";
import { adminService, isExpirado } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";
import { format, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlanBadge, StatusBadge } from "./shared";

const STALE = 1000 * 60 * 2;

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: () => adminService.getClientes(),
    staleTime: STALE,
  });

  const totalImobiliarias = data?.total_imobiliarias ?? 0;
  const totalCorretores = data?.total_corretores ?? 0;

  const todosClientes = [...(data?.imobiliarias ?? []), ...(data?.corretores ?? [])];

  const premium = todosClientes.filter((c) => c.plano !== "basic").length;

  const emBreve = todosClientes.filter((c) => {
    if (!c.plano_expira_em) return false;
    const expira = new Date(c.plano_expira_em);
    const em7dias = addDays(new Date(), 7);
    return isBefore(expira, em7dias) && !isExpirado(c.plano_expira_em);
  });

  const kpis = [
    { title: "Total de Imobiliárias", value: totalImobiliarias, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", bar: "from-blue-500 to-blue-700" },
    { title: "Total de Corretores", value: totalCorretores, icon: Users, color: "text-purple-600", bg: "bg-purple-50", bar: "from-purple-500 to-purple-700" },
    { title: "Clientes Premium/Gold", value: premium, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", bar: "from-yellow-400 to-yellow-600" },
    { title: "Expirando em 7 dias", value: emBreve.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", bar: "from-red-500 to-red-700" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="md:ml-16 flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <main className="md:ml-16 w-full pb-24 md:pb-0 p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Painel de administração</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Olá, <span className="text-red-500">{user?.name?.split(" ")[0]}!</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-clientes"] })}>
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {kpis.map((kpi, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                <div className={`h-1.5 bg-gradient-to-r ${kpi.bar}`} />
                <div className="p-4 md:p-5">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela de alertas */}
        {emBreve.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-6 py-4 border-b">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold">Expirando em breve</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plano</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Expira em</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {emBreve.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{c.tipo}</td>
                        <td className="px-4 py-3"><PlanBadge plano={c.plano} /></td>
                        <td className="px-4 py-3 text-red-600 font-medium">
                          {c.plano_expira_em
                            ? format(new Date(c.plano_expira_em), "dd/MM/yyyy")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(c.tipo === "imobiliaria" ? `/admin/imobiliarias/${c.id}` : `/admin/corretores/${c.id}`)}
                          >
                            Renovar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Imobiliárias</h2>
                <Button size="sm" variant="ghost" onClick={() => navigate("/admin/imobiliarias")}>Ver todas</Button>
              </div>
              <div className="divide-y">
                {(data?.imobiliarias ?? []).slice(0, 5).map((im) => (
                  <div key={im.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-sm">{im.name}</p>
                      <p className="text-xs text-muted-foreground">{im.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlanBadge plano={im.plano} />
                      <StatusBadge status={im.plano_status} expira_em={im.plano_expira_em} />
                    </div>
                  </div>
                ))}
                {(data?.imobiliarias ?? []).length === 0 && (
                  <p className="px-6 py-4 text-sm text-muted-foreground">Nenhuma imobiliária cadastrada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Corretores Autônomos</h2>
                <Button size="sm" variant="ghost" onClick={() => navigate("/admin/corretores")}>Ver todos</Button>
              </div>
              <div className="divide-y">
                {(data?.corretores ?? []).filter((c) => !c.organization_id).slice(0, 5).map((co) => (
                  <div key={co.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-sm">{co.name}</p>
                      <p className="text-xs text-muted-foreground">{co.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlanBadge plano={co.plano} />
                      <StatusBadge status={co.plano_status} expira_em={co.plano_expira_em} />
                    </div>
                  </div>
                ))}
                {(data?.corretores ?? []).filter((c) => !c.organization_id).length === 0 && (
                  <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum corretor autônomo.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
