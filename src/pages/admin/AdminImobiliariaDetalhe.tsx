import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, ArrowLeft, Building2, Mail, Phone, Settings2,
  CheckCircle2, Lock, User,
} from "lucide-react";
import { adminService, FEATURE_LABELS, FEATURE_PLAN_REQUIRED } from "@/services/admin.service";
import { PlanModal } from "@/components/admin/PlanModal";
import { PlanBadge, StatusBadge } from "./shared";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const STALE = 1000 * 60 * 2;

export default function AdminImobiliariaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [planModal, setPlanModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: () => adminService.getClientes(),
    staleTime: STALE,
  });

  const imobiliaria = data?.imobiliarias.find((i) => i.id === id);
  const corretoresDaImo = (data?.corretores ?? []).filter((c) => c.organization_id === id);

  const handleAlterarPlano = async (plano: string, expira_em?: string) => {
    if (!id) return;
    try {
      await adminService.alterarPlanoImobiliaria(id, { plano, expira_em });
      toast.success("Plano atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-clientes"] });
    } catch {
      toast.error("Erro ao atualizar plano.");
      throw new Error("Erro");
    }
  };

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

  if (!imobiliaria) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="md:ml-16 flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Imobiliária não encontrada.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <main className="md:ml-16 w-full pb-24 md:pb-0 p-4 md:p-8 space-y-6">
        {/* Back + header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/imobiliarias")} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{imobiliaria.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <PlanBadge plano={imobiliaria.plano} />
                  <StatusBadge status={imobiliaria.plano_status} expira_em={imobiliaria.plano_expira_em} />
                  {imobiliaria.plano_expira_em && (
                    <span className="text-xs text-muted-foreground">
                      Expira em {format(new Date(imobiliaria.plano_expira_em), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => setPlanModal(true)}>
              <Settings2 className="w-4 h-4 mr-2" /> Alterar Plano
            </Button>
          </div>
        </div>

        {/* Dados da imobiliária */}
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{imobiliaria.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">{imobiliaria.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Membro desde</p>
                <p className="text-sm font-medium">
                  {format(new Date(imobiliaria.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ativas */}
          <Card className="border-green-200 bg-green-50/40">
            <CardContent className="p-5">
              <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4" /> Features Ativas
              </h3>
              <div className="flex flex-wrap gap-2">
                {imobiliaria.features_ativas.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {FEATURE_LABELS[feat] ?? feat}
                  </div>
                ))}
                {imobiliaria.features_ativas.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma feature ativa.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bloqueadas */}
          <Card className="border-gray-200 bg-gray-50/40">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-600 flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4" /> Features Bloqueadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {imobiliaria.features_bloqueadas.map((feat) => (
                  <div
                    key={feat}
                    className="flex flex-col px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-sm"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      {FEATURE_LABELS[feat] ?? feat}
                    </span>
                    {FEATURE_PLAN_REQUIRED[feat] && (
                      <span className="text-xs text-gray-400 ml-5">→ {FEATURE_PLAN_REQUIRED[feat]}</span>
                    )}
                  </div>
                ))}
                {imobiliaria.features_bloqueadas.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma feature bloqueada.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Corretores da imobiliária */}
        <Card>
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold">Corretores vinculados ({corretoresDaImo.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cargo</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plano herdado</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Membro desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {corretoresDaImo.map((co) => (
                    <tr key={co.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-medium">{co.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{co.email}</td>
                      <td className="px-4 py-3 capitalize">
                        <Badge variant="outline">{co.role === "owner" ? "Dono" : "Agente"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <PlanBadge plano={imobiliaria.plano} />
                          <span className="text-xs text-muted-foreground">(herdado)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(co.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                  {corretoresDaImo.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-muted-foreground">
                        Nenhum corretor vinculado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <PlanModal
        open={planModal}
        onOpenChange={setPlanModal}
        clienteNome={imobiliaria.name}
        planoAtual={imobiliaria.plano}
        tipo="imobiliaria"
        onSave={handleAlterarPlano}
      />
    </div>
  );
}
