import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgService, OrgInvite } from "@/services/org.service";
import { toast } from "sonner";
import { Mail, Plus, Copy, X, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const statusConfig: Record<OrgInvite["status"], { label: string; icon: React.ElementType; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-400" },
  aceito: { label: "Aceito", icon: CheckCircle2, color: "text-green-400" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-red-400" },
};

const Convites = () => {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: convites = [], isLoading } = useQuery({
    queryKey: ["org-invites"],
    queryFn: orgService.getInvites,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (e: string) => orgService.createInvite(e),
    onSuccess: (invite) => {
      qc.invalidateQueries({ queryKey: ["org-invites"] });
      toast.success("Convite criado!");
      setEmail("");
      copyLink(invite.token);
    },
    onError: () => toast.error("Erro ao criar convite. Verifique o e-mail."),
  });

  const cancelMutation = useMutation({
    mutationFn: orgService.cancelInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-invites"] });
      toast.success("Convite cancelado.");
    },
    onError: () => toast.error("Erro ao cancelar convite."),
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/aceitar-convite?token=${token}`;
    navigator.clipboard.writeText(link).then(() => toast.success("Link copiado para a área de transferência!"));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    createMutation.mutate(email.trim());
  };

  const handleCancel = (id: string) => {
    if (!window.confirm("Cancelar este convite?")) return;
    cancelMutation.mutate(id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-16 p-6 lg:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Mail className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-foreground">Convites</h1>
          </div>

          {/* Formulário de criação */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Convidar corretor</h2>
            <form onSubmit={handleCreate} className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  E-mail do corretor
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="corretor@email.com"
                  className="h-11"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !email.trim()}
                  className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Convidar
                </button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              Um link de convite será gerado automaticamente após o envio.
            </p>
          </div>

          {/* Lista de convites */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Convites enviados</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : convites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Mail className="w-8 h-8 opacity-40" />
                <p className="text-sm">Nenhum convite enviado ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {convites.map((c) => {
                  const cfg = statusConfig[c.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-accent/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </div>

                        {c.status === "pendente" && (
                          <>
                            <button
                              onClick={() => copyLink(c.token)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Copiar link do convite"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(c.id)}
                              disabled={cancelMutation.isPending}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Cancelar convite"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Convites;
