import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgService, OrgProfile } from "@/services/org.service";
import { toast } from "sonner";
import { Building2, Edit2, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MinhaImobiliaria = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<OrgProfile>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ["org-profile"],
    queryFn: orgService.getProfile,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: orgService.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      toast.success("Dados atualizados com sucesso!");
      setEditing(false);
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  const handleEdit = () => {
    setForm({ name: profile?.name, email: profile?.email, phone: profile?.phone });
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = () => {
    if (!form.name?.trim() || !form.email?.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-16 p-6 lg:p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-foreground">Minha Imobiliária</h1>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-5">
                {[
                  { label: "Nome", field: "name" as const, type: "text" },
                  { label: "E-mail", field: "email" as const, type: "email" },
                  { label: "Telefone", field: "phone" as const, type: "tel" },
                ].map(({ label, field, type }) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {label}
                    </Label>
                    {editing ? (
                      <Input
                        type={type}
                        value={form[field] ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        className="h-11"
                      />
                    ) : (
                      <p className="text-foreground text-sm py-2 px-3 bg-muted/40 rounded-lg">
                        {profile?.[field] || <span className="text-muted-foreground">—</span>}
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={mutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                      >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Salvar
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MinhaImobiliaria;
