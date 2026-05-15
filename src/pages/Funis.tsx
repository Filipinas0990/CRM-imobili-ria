import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { funilService } from "@/services/funil.service";
import {
  Plus, Zap, Loader2, Pencil, Trash2,
  Type, Image, Video, Mic, ListOrdered,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TIPO_ICON: Record<string, React.ReactNode> = {
  texto:  <Type  className="w-3 h-3" />,
  imagem: <Image className="w-3 h-3" />,
  video:  <Video className="w-3 h-3" />,
  audio:  <Mic   className="w-3 h-3" />,
};

const TIPO_COLOR: Record<string, string> = {
  texto:  "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300",
  imagem: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300",
  video:  "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
  audio:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function Funis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const { data: funis = [], isLoading } = useQuery({
    queryKey: ["funis"],
    queryFn: funilService.listar,
  });

  const deletarMutation = useMutation({
    mutationFn: (id: string) => funilService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funis"] });
      toast.success("Funil excluído");
      setDeletandoId(null);
    },
    onError: () => toast.error("Erro ao excluir funil"),
  });

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-[#0f1117]">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-white dark:bg-card border-b px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              Funis de Disparo
            </h1>
            <p className="text-sm text-muted-foreground">
              Sequências de mensagens para usar nas campanhas
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/funis/novo")}
            className="bg-emerald-500 hover:bg-emerald-600 gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Funil
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          )}

          {!isLoading && funis.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
              <ListOrdered className="w-12 h-12 opacity-20" />
              <p className="text-sm">Nenhum funil criado ainda.</p>
              <Button
                onClick={() => navigate("/dashboard/funis/novo")}
                className="bg-emerald-500 hover:bg-emerald-600 gap-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                Criar primeiro funil
              </Button>
            </div>
          )}

          {!isLoading && funis.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {funis.map((funil) => (
                <div
                  key={funil.id}
                  className="rounded-2xl border bg-white dark:bg-card shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{funil.nome}</h3>
                        {funil.descricao && (
                          <p className="text-xs text-green-100 mt-0.5 truncate">{funil.descricao}</p>
                        )}
                      </div>
                      <Badge className="bg-white/20 text-white border-0 text-xs flex-shrink-0">
                        {funil.etapas?.length ?? 0} etapa{(funil.etapas?.length ?? 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>

                  {/* Etapas preview */}
                  <div className="p-4 flex-1 space-y-2">
                    {(funil.etapas ?? []).slice(0, 3).map((etapa, i) => (
                      <div key={etapa.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{i + 1}.</span>
                        <Badge className={cn("text-xs border-0 gap-1 font-normal", TIPO_COLOR[etapa.tipo] ?? TIPO_COLOR.texto)}>
                          {TIPO_ICON[etapa.tipo]}
                          {etapa.tipo.charAt(0).toUpperCase() + etapa.tipo.slice(1)}
                        </Badge>
                        {etapa.tipo === "texto" && (
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {etapa.conteudo}
                          </span>
                        )}
                      </div>
                    ))}
                    {(funil.etapas?.length ?? 0) > 3 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        +{funil.etapas.length - 3} etapa{funil.etapas.length - 3 !== 1 ? "s" : ""}...
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 pt-2 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(funil.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/funis/${funil.id}/editar`)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletandoId(funil.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!deletandoId} onOpenChange={() => setDeletandoId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir funil?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Esta ação não pode ser desfeita. O funil será removido permanentemente.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletandoId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deletarMutation.isPending}
              onClick={() => deletandoId && deletarMutation.mutate(deletandoId)}
            >
              {deletarMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
