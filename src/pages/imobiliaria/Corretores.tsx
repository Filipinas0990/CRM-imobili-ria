import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import { toast } from "sonner";
import { Users, Trash2, Loader2, UserCircle2 } from "lucide-react";

const Corretores = () => {
  const qc = useQueryClient();

  const { data: membros = [], isLoading } = useQuery({
    queryKey: ["org-members"],
    queryFn: orgService.getMembers,
    staleTime: 1000 * 60 * 5,
  });

  const removeMutation = useMutation({
    mutationFn: orgService.removeMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-members"] });
      toast.success("Corretor removido.");
    },
    onError: () => toast.error("Erro ao remover corretor."),
  });

  const handleRemove = (userId: string, name: string) => {
    if (!window.confirm(`Remover ${name} da imobiliária?`)) return;
    removeMutation.mutate(userId);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-16 p-6 lg:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-foreground">Corretores</h1>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : membros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <UserCircle2 className="w-10 h-10 opacity-40" />
                <p className="text-sm">Nenhum corretor vinculado ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {membros.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-accent/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                        {m.role}
                      </span>
                      <button
                        onClick={() => handleRemove(m.id, m.name)}
                        disabled={removeMutation.isPending}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remover corretor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Corretores;
