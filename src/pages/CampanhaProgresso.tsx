import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Zap } from "lucide-react";
import { campanhaService, type CampanhaProgresso, type CampanhaStatus } from "@/services/campanha.service";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<CampanhaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  em_andamento: {
    label: "Enviando...",
    color: "text-blue-500",
    icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
  },
  concluido: {
    label: "Concluído!",
    color: "text-green-500",
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  },
  cancelado: {
    label: "Cancelado pelo usuário",
    color: "text-yellow-500",
    icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  },
  erro: {
    label: "Erro — contate o suporte",
    color: "text-red-500",
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
};

export default function CampanhaProgresso() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [progresso, setProgresso] = useState<CampanhaProgresso | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchProgresso() {
    if (!id) return;
    try {
      const data = await campanhaService.getProgresso(id);
      setProgresso(data);
      if (data.status !== "em_andamento") {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Erro ao buscar progresso";
      setErro(msg);
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    fetchProgresso();
    intervalRef.current = setInterval(fetchProgresso, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  async function handleCancelar() {
    if (!id) return;
    setCancelando(true);
    try {
      await campanhaService.cancelar(id);
      toast.success("Cancelamento solicitado. Aguarde...");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Erro ao cancelar campanha";
      toast.error(msg);
    } finally {
      setCancelando(false);
    }
  }

  const statusCfg = progresso ? STATUS_CONFIG[progresso.status] : null;

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
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Progresso da Campanha
            </h1>
            <p className="text-sm text-muted-foreground">Acompanhe o envio em tempo real</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-start justify-center p-8">
          <div className="w-full max-w-lg space-y-6">

            {/* Loading inicial */}
            {!progresso && !erro && (
              <div className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-muted-foreground text-sm">Carregando progresso...</p>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="rounded-2xl border bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 p-6 text-center">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 dark:text-red-400 font-medium">{erro}</p>
              </div>
            )}

            {/* Progresso */}
            {progresso && statusCfg && (
              <>
                {/* Card status */}
                <div className="rounded-2xl border bg-white dark:bg-card shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    {statusCfg.icon}
                    <span className={cn("text-lg font-bold", statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-foreground">{progresso.percentual}%</span>
                    </div>
                    <Progress value={progresso.percentual} className="h-3" />
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-muted/40 p-4 text-center">
                      <p className="text-2xl font-black text-foreground">{progresso.total}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total</p>
                    </div>
                    <div className="rounded-xl bg-green-50 dark:bg-green-900/10 p-4 text-center border border-green-100 dark:border-green-900/30">
                      <p className="text-2xl font-black text-green-600 dark:text-green-400">{progresso.enviados}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Enviados</p>
                    </div>
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/10 p-4 text-center border border-red-100 dark:border-red-900/30">
                      <p className="text-2xl font-black text-red-600 dark:text-red-400">{progresso.falhas}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Falhas</p>
                    </div>
                  </div>

                  {/* Polling indicator */}
                  {progresso.status === "em_andamento" && (
                    <p className="text-xs text-muted-foreground text-center">
                      Atualizando a cada 5 segundos...
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-3">
                  {progresso.em_execucao && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelar}
                      disabled={cancelando}
                      className="w-full"
                    >
                      {cancelando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        "Cancelar Campanha"
                      )}
                    </Button>
                  )}

                  {progresso.status !== "em_andamento" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard/campanhas/historico")}
                        className="w-full"
                      >
                        Ver histórico de campanhas
                      </Button>
                      <Button
                        onClick={() => navigate("/dashboard/campanhas")}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        Nova campanha
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
