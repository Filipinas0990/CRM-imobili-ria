import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  metaService,
  MetaComProgresso,
  MetaPayload,
  MetaTipo,
} from "@/services/meta.service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Home,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  ChevronLeft,
  CalendarRange,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

// ─── Helpers de tipo ──────────────────────────────────────────────────────────
const TIPOS: { tipo: MetaTipo; label: string; Icon: React.ElementType; color: string; bg: string }[] = [
  { tipo: "novos_clientes", label: "Novos Clientes", Icon: UserPlus, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
  { tipo: "visitas",        label: "Visitas",         Icon: Home,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  { tipo: "propostas",      label: "Propostas",       Icon: FileText, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30" },
];

function getTipo(tipo: MetaTipo) {
  return TIPOS.find((t) => t.tipo === tipo) ?? TIPOS[0];
}

function getProgressColor(pct: number) {
  if (pct >= 100) return "#22c55e";
  if (pct >= 80)  return "#3b82f6";
  if (pct >= 50)  return "#f59e0b";
  return "#ef4444";
}

function formatDate(d: string) {
  // YYYY-MM-DD → DD/MM/YYYY
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function labelUnidade(tipo: MetaTipo, n: number) {
  const labels: Record<MetaTipo, [string, string]> = {
    novos_clientes: ["lead", "leads"],
    visitas:        ["visita", "visitas"],
    propostas:      ["proposta", "propostas"],
  };
  return n === 1 ? labels[tipo][0] : labels[tipo][1];
}

// ─── Atalhos de período ───────────────────────────────────────────────────────
function getThisMonth() {
  const now = new Date();
  const ini = new Date(now.getFullYear(), now.getMonth(), 1);
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { ini: ini.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}
function getNextMonth() {
  const now = new Date();
  const ini = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const fim = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { ini: ini.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}
function getThisQuarter() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const ini = new Date(now.getFullYear(), q * 3, 1);
  const fim = new Date(now.getFullYear(), q * 3 + 3, 0);
  return { ini: ini.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

// ─── Modal criar/editar ───────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  initial?: MetaComProgresso | null;
  onSave: (payload: MetaPayload) => void;
  loading?: boolean;
}

function MetaModal({ open, onClose, initial, onSave, loading }: ModalProps) {
  const [tipo, setTipo] = useState<MetaTipo>("novos_clientes");
  const [valorAlvo, setValorAlvo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (open) {
      setTipo(initial?.tipo ?? "novos_clientes");
      setValorAlvo(initial?.valor_alvo?.toString() ?? "");
      setDataInicio(initial?.data_inicio ?? "");
      setDataFim(initial?.data_fim ?? "");
    }
  }, [open, initial]);

  function aplicarAtalho(fn: () => { ini: string; fim: string }) {
    const { ini, fim } = fn();
    setDataInicio(ini);
    setDataFim(fim);
  }

  function handleSave() {
    const alvo = parseInt(valorAlvo, 10);
    if (!valorAlvo || isNaN(alvo) || alvo <= 0) {
      toast.error("Informe uma quantidade válida (número inteiro positivo)");
      return;
    }
    if (!dataInicio || !dataFim) {
      toast.error("Informe o período da meta");
      return;
    }
    if (dataFim < dataInicio) {
      toast.error("A data fim deve ser igual ou posterior à data início");
      return;
    }
    onSave({ tipo, valor_alvo: alvo, data_inicio: dataInicio, data_fim: dataFim });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {initial ? "Editar Meta" : "Nova Meta"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Defina um objetivo e acompanhe seu progresso.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Tipo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tipo de Meta *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(({ tipo: t, label, Icon, color, bg }) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                    tipo === t
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-border bg-card hover:border-border/60"
                  )}
                >
                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                    <Icon className={clsx("w-4 h-4", color)} />
                  </div>
                  <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Meta (quantidade) *
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Ex: 10"
              value={valorAlvo}
              onChange={(e) => setValorAlvo(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>

          {/* Período */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Período *
              </label>
              <div className="flex gap-1.5">
                {[
                  { label: "Este mês", fn: getThisMonth },
                  { label: "Próx. mês", fn: getNextMonth },
                  { label: "Trimestre", fn: getThisQuarter },
                ].map(({ label, fn }) => (
                  <button
                    key={label}
                    onClick={() => aplicarAtalho(fn)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">De</p>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Até</p>
                <Input
                  type="date"
                  value={dataFim}
                  min={dataInicio}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Card de meta ─────────────────────────────────────────────────────────────
function MetaCard({
  meta,
  onEditar,
  onDeletar,
}: {
  meta: MetaComProgresso;
  onEditar: () => void;
  onDeletar: () => void;
}) {
  const { label, Icon, color, bg } = getTipo(meta.tipo);
  const pct = Math.min(meta.percentual, 100);
  const barColor = getProgressColor(pct);
  const atingida = pct >= 100;

  return (
    <div className={clsx(
      "bg-card rounded-2xl border p-5 shadow-sm transition-all",
      atingida ? "border-green-300 dark:border-green-700" : "border-border"
    )}>
      {/* Topo */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
            <Icon className={clsx("w-5 h-5", color)} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{label}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <CalendarRange className="w-3 h-3" />
              <span>{formatDate(meta.data_inicio)} → {formatDate(meta.data_fim)}</span>
            </div>
          </div>
        </div>

        {atingida && (
          <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Meta atingida!
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {meta.progresso} de {meta.valor_alvo} {labelUnidade(meta.tipo, meta.valor_alvo)}
          </span>
          <span className="font-bold" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:text-foreground"
          onClick={onEditar}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={onDeletar}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Metas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<MetaComProgresso | null>(null);
  const [deletando, setDeletando] = useState<MetaComProgresso | null>(null);

  const { data: metas = [], isLoading } = useQuery({
    queryKey: ["metas"],
    queryFn: () => metaService.getAll(),
    refetchInterval: 1000 * 60, // atualiza a cada minuto
  });

  const criarMutation = useMutation({
    mutationFn: (payload: MetaPayload) => metaService.create(payload),
    onSuccess: () => {
      toast.success("Meta criada!");
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      setModalOpen(false);
    },
    onError: () => toast.error("Erro ao criar meta"),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MetaPayload> }) =>
      metaService.update(id, payload),
    onSuccess: () => {
      toast.success("Meta atualizada!");
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      setEditando(null);
    },
    onError: () => toast.error("Erro ao atualizar meta"),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: string) => metaService.delete(id),
    onSuccess: () => {
      toast.success("Meta excluída!");
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      setDeletando(null);
    },
    onError: () => toast.error("Erro ao excluir meta"),
  });

  // Separa metas atingidas e em andamento
  const atingidas = metas.filter((m) => m.percentual >= 100);
  const emAndamento = metas.filter((m) => m.percentual < 100);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8 space-y-6">
          {/* Voltar */}
          <button
            onClick={() => navigate("/dashboard/configuracoes")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Configurações
          </button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  Minhas Metas
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Defina objetivos e acompanhe seu progresso em tempo real.
                </p>
              </div>
            </div>
            <Button
              onClick={() => { setEditando(null); setModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Meta
            </Button>
          </div>

          {/* Conteúdo */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : metas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="font-semibold text-foreground text-lg">Nenhuma meta definida</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                Crie sua primeira meta e acompanhe seu desempenho.
              </p>
              <Button
                onClick={() => { setEditando(null); setModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nova Meta
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Em andamento */}
              {emAndamento.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Em andamento
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {emAndamento.map((meta) => (
                      <MetaCard
                        key={meta.id}
                        meta={meta}
                        onEditar={() => { setEditando(meta); setModalOpen(true); }}
                        onDeletar={() => setDeletando(meta)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Atingidas */}
              {atingidas.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    ✅ Metas atingidas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {atingidas.map((meta) => (
                      <MetaCard
                        key={meta.id}
                        meta={meta}
                        onEditar={() => { setEditando(meta); setModalOpen(true); }}
                        onDeletar={() => setDeletando(meta)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal criar/editar */}
      <MetaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        initial={editando}
        loading={criarMutation.isPending || editarMutation.isPending}
        onSave={(payload) => {
          if (editando) {
            editarMutation.mutate({ id: editando.id, payload });
          } else {
            criarMutation.mutate(payload);
          }
        }}
      />

      {/* Modal confirmar exclusão */}
      <Dialog open={!!deletando} onOpenChange={(v) => !v && setDeletando(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir meta?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletando(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletando && deletarMutation.mutate(deletando.id)}
              disabled={deletarMutation.isPending}
            >
              {deletarMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
