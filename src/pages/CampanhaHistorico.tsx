import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { campanhaService, type CampanhaStatus } from "@/services/campanha.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, Loader2, Clock, Users, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_BADGE: Record<CampanhaStatus, { label: string; className: string }> = {
  em_andamento: { label: "Em andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  concluido:    { label: "Concluído",    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  cancelado:    { label: "Cancelado",    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  erro:         { label: "Erro",         className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

function formatIntervalo(segundos: number): string {
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
}

export default function CampanhaHistorico() {
  const navigate = useNavigate();

  const { data: campanhas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["campanhas-historico"],
    queryFn: campanhaService.listar,
  });

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-[#0f1117]">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-white dark:bg-card border-b px-6 py-4 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => navigate("/dashboard/campanhas")}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Histórico de Campanhas
            </h1>
            <p className="text-sm text-muted-foreground">Todos os disparos realizados</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => navigate("/dashboard/campanhas")} className="bg-blue-500 hover:bg-blue-600">
              Nova campanha
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
              <XCircle className="w-10 h-10 opacity-40" />
              <p>Erro ao carregar histórico.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          )}

          {!isLoading && !isError && campanhas.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
              <Zap className="w-10 h-10 opacity-20" />
              <p className="text-sm">Nenhuma campanha disparada ainda.</p>
              <Button size="sm" onClick={() => navigate("/dashboard/campanhas")} className="bg-blue-500 hover:bg-blue-600 mt-2">
                Criar primeira campanha
              </Button>
            </div>
          )}

          {!isLoading && !isError && campanhas.length > 0 && (
            <div className="rounded-2xl border bg-white dark:bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data/Hora</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enviados</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Falhas</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Intervalo</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campanhas.map((c) => {
                    const statusCfg = STATUS_BADGE[c.status] ?? STATUS_BADGE.erro;
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground font-medium">
                              {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-semibold">{c.total}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="font-semibold text-green-600 dark:text-green-400">{c.enviados}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <span className={cn("font-semibold", c.falhas > 0 ? "text-red-500" : "text-muted-foreground")}>
                              {c.falhas}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center text-muted-foreground">
                          {formatIntervalo(c.intervalo_segundos)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge className={cn("border-0 text-xs font-medium", statusCfg.className)}>
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {c.status === "em_andamento" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/campanhas/progresso/${c.id}`)}
                              className="text-xs"
                            >
                              Ver progresso
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
