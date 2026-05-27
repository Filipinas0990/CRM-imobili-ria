import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { etiquetaService, Etiqueta, EtiquetaPayload } from "@/services/etiqueta.service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tag,
  Megaphone,
  Star,
  Target,
  Monitor,
  Smartphone,
  Flag,
  Plus,
  Pencil,
  Trash2,
  Zap,
  BarChart2,
  ChevronLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";

// ─── Ícones disponíveis ───────────────────────────────────────────────────────
const ICONES = [
  { key: "tag", Icon: Tag },
  { key: "megaphone", Icon: Megaphone },
  { key: "star", Icon: Star },
  { key: "target", Icon: Target },
  { key: "monitor", Icon: Monitor },
  { key: "smartphone", Icon: Smartphone },
  { key: "flag", Icon: Flag },
];

export function getIconComponent(key: string) {
  return ICONES.find((i) => i.key === key)?.Icon ?? Tag;
}

// ─── Paleta de cores ──────────────────────────────────────────────────────────
const CORES = [
  "#6366f1", // Roxo (padrão)
  "#f59e0b", // Âmbar
  "#ef4444", // Vermelho
  "#22c55e", // Verde
  "#3b82f6", // Azul
  "#ec4899", // Rosa
  "#f97316", // Laranja
  "#14b8a6", // Teal
  "#8b5cf6", // Violeta
  "#64748b", // Cinza
];

// ─── Badge de etiqueta ────────────────────────────────────────────────────────
export function EtiquetaBadge({ etiqueta }: { etiqueta: { name: string; color: string; icon: string } }) {
  const Icon = getIconComponent(etiqueta.icon);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium"
      style={{ backgroundColor: etiqueta.color }}
    >
      <Icon className="w-3 h-3" />
      {etiqueta.name}
    </span>
  );
}

// ─── Modal criar/editar ───────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Etiqueta | null;
  onSave: (payload: EtiquetaPayload) => void;
  loading?: boolean;
}

function EtiquetaModal({ open, onClose, initial, onSave, loading }: ModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CORES[0]);
  const [icon, setIcon] = useState("tag");
  const [keyword, setKeyword] = useState("");
  const colorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setColor(initial?.color ?? CORES[0]);
      setIcon(initial?.icon ?? "tag");
      setKeyword(initial?.keyword_trigger ?? "");
    }
  }, [open, initial]);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome da etiqueta");
      return;
    }
    onSave({
      name: name.trim(),
      color,
      icon,
      keyword_trigger: keyword.trim() || null,
      keyword_type: "contains",
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {initial ? "Editar Etiqueta" : "Nova Etiqueta"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Crie uma tag para organizar seus leads.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Nome da Tag
            </label>
            <Input
              placeholder="Ex: Meta Ads, Indicação, Instagram"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Ícone e Cor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ícone e Cor
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
              {/* Seletor de cor */}
              <button
                onClick={() => colorRef.current?.click()}
                className="w-10 h-10 rounded-lg border-2 border-white shadow-md flex-shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
                title="Clique para escolher a cor"
              />
              <input
                ref={colorRef}
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />

              {/* Seletor de ícone */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ICONES.map(({ key, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setIcon(key)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      icon === key
                        ? "text-white shadow-md scale-105"
                        : "bg-background border border-border text-muted-foreground hover:text-foreground"
                    }`}
                    style={icon === key ? { backgroundColor: color } : {}}
                    title={key}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Paleta rápida */}
            <div className="flex gap-2 flex-wrap pt-1">
              {CORES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                    color === c ? "ring-2 ring-offset-2 ring-foreground/40 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Palavra-chave */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Palavra-chave Gatilho
              </label>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <Input
                  className="pl-9"
                  placeholder="Ex: meta-ads"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="px-3 py-2 rounded-md border border-border bg-muted/50 text-xs font-medium text-muted-foreground flex items-center gap-1">
                CONTÉM
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Se a mensagem contiver esta palavra, a tag será inserida automaticamente.
            </p>
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Etiquetas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Etiqueta | null>(null);
  const [deletando, setDeletando] = useState<Etiqueta | null>(null);

  const { data: etiquetas = [], isLoading } = useQuery({
    queryKey: ["etiquetas"],
    queryFn: () => etiquetaService.getAll(),
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["etiquetas-stats"],
    queryFn: () => etiquetaService.getStats(),
  });

  const criarMutation = useMutation({
    mutationFn: (payload: EtiquetaPayload) => etiquetaService.create(payload),
    onSuccess: () => {
      toast.success("Etiqueta criada!");
      queryClient.invalidateQueries({ queryKey: ["etiquetas"] });
      queryClient.invalidateQueries({ queryKey: ["etiquetas-stats"] });
      setModalOpen(false);
    },
    onError: () => toast.error("Erro ao criar etiqueta"),
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EtiquetaPayload> }) =>
      etiquetaService.update(id, payload),
    onSuccess: () => {
      toast.success("Etiqueta atualizada!");
      queryClient.invalidateQueries({ queryKey: ["etiquetas"] });
      queryClient.invalidateQueries({ queryKey: ["etiquetas-stats"] });
      setEditando(null);
    },
    onError: () => toast.error("Erro ao atualizar etiqueta"),
  });

  const deletarMutation = useMutation({
    mutationFn: (id: string) => etiquetaService.delete(id),
    onSuccess: () => {
      toast.success("Etiqueta excluída!");
      queryClient.invalidateQueries({ queryKey: ["etiquetas"] });
      queryClient.invalidateQueries({ queryKey: ["etiquetas-stats"] });
      setDeletando(null);
    },
    onError: () => toast.error("Erro ao excluir etiqueta"),
  });

  // Monta dados do gráfico — cada data é uma linha com contagem por etiqueta
  const chartData = (() => {
    if (stats.length === 0) return [];
    const dates = stats[0]?.series.map((s) => s.date) ?? [];
    return dates.map((date) => {
      const point: Record<string, string | number> = {
        date: new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
      };
      stats.forEach((s) => {
        const entry = s.series.find((x) => x.date === date);
        point[s.name] = entry?.count ?? 0;
      });
      return point;
    });
  })();

  const statMap = Object.fromEntries(stats.map((s) => [s.etiqueta_id, s]));

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
              <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Origens (Tags)
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
                Crie marcações para identificar de onde seus leads estão vindo. Configure
                palavras-chave para que a marcação ocorra de forma 100% automática.
              </p>
            </div>
          </div>
          <Button
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Etiqueta
          </Button>
        </div>

        {/* Gráfico */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-foreground">Desempenho (Últimos 7 dias)</h2>
          </div>
          {stats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : "Nenhuma etiqueta criada ainda."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} lead(s)`, name]}
                />
                <Legend iconType="circle" iconSize={8} />
                {stats.map((s) => (
                  <Line
                    key={s.etiqueta_id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ fill: s.color, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cards de etiquetas */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : etiquetas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="font-semibold text-foreground">Nenhuma etiqueta criada</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Crie sua primeira tag para organizar os leads.
            </p>
            <Button
              onClick={() => { setEditando(null); setModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Etiqueta
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {etiquetas.map((et) => {
              const Icon = getIconComponent(et.icon);
              const stat = statMap[et.id];
              return (
                <div
                  key={et.id}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-3"
                >
                  {/* Topo: ícone + nome + total */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: et.color + "22" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: et.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{et.name}</p>
                      <p className="text-xs font-medium" style={{ color: et.color }}>
                        {stat?.total_leads ?? 0} LEADS
                      </p>
                    </div>
                  </div>

                  {/* Palavra-chave */}
                  {et.keyword_trigger ? (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Palavra Gatilho
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm text-foreground font-medium">
                            {et.keyword_trigger}
                          </span>
                          <span className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground font-medium">
                            CONTÉM
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Palavra Gatilho
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Não configurada</p>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditando(et); setModalOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setDeletando(et)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </main>

      {/* Modal criar/editar */}
      <EtiquetaModal
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
            <DialogTitle>Excluir etiqueta?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A etiqueta <strong>{deletando?.name}</strong> será removida de todos os leads.
            Esta ação não pode ser desfeita.
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
