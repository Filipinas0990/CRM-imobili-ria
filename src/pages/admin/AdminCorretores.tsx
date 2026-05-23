import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, Eye, Settings2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { PlanModal } from "@/components/admin/PlanModal";
import { PlanBadge, StatusBadge } from "./shared";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import type { ClienteAdmin } from "@/services/admin.service";

const STALE = 1000 * 60 * 2;

export default function AdminCorretores() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planModal, setPlanModal] = useState<ClienteAdmin | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: () => adminService.getClientes(),
    staleTime: STALE,
  });

  const autonomos = (data?.corretores ?? [])
    .filter((c) => !c.organization_id)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

  const handleAlterarPlano = async (plano: string, expira_em?: string) => {
    if (!planModal) return;
    try {
      await adminService.alterarPlanoCorretor(planModal.id, { plano, expira_em });
      toast.success("Plano atualizado com sucesso!");
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

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <main className="md:ml-16 w-full pb-24 md:pb-0 p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Corretores Autônomos</h1>
            <p className="text-sm text-muted-foreground">{autonomos.length} sem imobiliária vinculada</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar corretor..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Nome</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Telefone</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">CRECI</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plano</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Expira em</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {autonomos.map((co) => (
                    <tr key={co.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{co.name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{co.email}</td>
                      <td className="px-4 py-4 text-muted-foreground">{co.phone || "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground">{co.creci || "—"}</td>
                      <td className="px-4 py-4"><PlanBadge plano={co.plano} /></td>
                      <td className="px-4 py-4"><StatusBadge status={co.plano_status} expira_em={co.plano_expira_em} /></td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {co.plano_expira_em
                          ? format(new Date(co.plano_expira_em), "dd/MM/yyyy")
                          : "Sem expiração"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/corretores/${co.id}`)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setPlanModal(co)}>
                            <Settings2 className="w-3.5 h-3.5 mr-1" /> Plano
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {autonomos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                        Nenhum corretor autônomo encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {planModal && (
        <PlanModal
          open={!!planModal}
          onOpenChange={(open) => !open && setPlanModal(null)}
          clienteNome={planModal.name}
          planoAtual={planModal.plano}
          tipo="corretor"
          onSave={handleAlterarPlano}
        />
      )}
    </div>
  );
}
