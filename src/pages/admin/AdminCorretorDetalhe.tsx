import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, ArrowLeft, User, Mail, Phone, Settings2,
  CheckCircle2, Lock, CreditCard,
} from "lucide-react";
import { adminService, FEATURE_LABELS, FEATURE_PLAN_REQUIRED } from "@/services/admin.service";
import { PlanModal } from "@/components/admin/PlanModal";
import { PlanBadge, StatusBadge } from "./shared";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const STALE = 1000 * 60 * 2;

export default function AdminCorretorDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [planModal, setPlanModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: () => adminService.getClientes(),
    staleTime: STALE,
  });

  const corretor = (data?.corretores ?? []).find((c) => c.id === id);

  const handleAlterarPlano = async (plano: string, expira_em?: string) => {
    if (!id) return;
    try {
      await adminService.alterarPlanoCorretor(id, { plano, expira_em });
      toast.success("Plano atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-clientes"] });
    } catch {
      toast.error("Erro ao atualizar plano.");
      throw new Error("Erro");
    }
  };

  const handleCancelarPlano = async () => {
    if (!id || !corretor) return;
    if (!confirm(`Cancelar plano de ${corretor.name} e reverter para Basic?`)) return;
    try {
      await adminService.alterarPlanoCorretor(id, { plano: "basic" });
      toast.success("Plano cancelado — revertido para Basic.");
      queryClient.invalidateQueries({ queryKey: ["admin-clientes"] });
    } catch {
      toast.error("Erro ao cancelar plano.");
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

  if (!corretor) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="md:ml-16 flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Corretor não encontrado.</p>
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/corretores")} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{corretor.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <PlanBadge plano={corretor.plano} />
                  <StatusBadge status={corretor.plano_status} expira_em={corretor.plano_expira_em} />
                  {corretor.plano_expira_em && (
                    <span className="text-xs text-muted-foreground">
                      Expira em {format(new Date(corretor.plano_expira_em), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setPlanModal(true)}>
                <Settings2 className="w-4 h-4 mr-2" /> Alterar Plano
              </Button>
              {corretor.plano !== "basic" && (
                <Button variant="destructive" onClick={handleCancelarPlano}>
                  <CreditCard className="w-4 h-4 mr-2" /> Cancelar Plano
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dados do corretor */}
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{corretor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">{corretor.phone || "—"}</p>
              </div>
            </div>
            {corretor.creci && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">CRECI</p>
                  <p className="text-sm font-medium">{corretor.creci}</p>
                </div>
              </div>
            )}
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
                {corretor.features_ativas.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {FEATURE_LABELS[feat] ?? feat}
                  </div>
                ))}
                {corretor.features_ativas.length === 0 && (
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
                {corretor.features_bloqueadas.map((feat) => (
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
                {corretor.features_bloqueadas.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma feature bloqueada.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PlanModal
        open={planModal}
        onOpenChange={setPlanModal}
        clienteNome={corretor.name}
        planoAtual={corretor.plano}
        tipo="corretor"
        onSave={handleAlterarPlano}
      />
    </div>
  );
}
