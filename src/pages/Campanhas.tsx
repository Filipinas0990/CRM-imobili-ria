import { useState, useMemo, useRef, useEffect } from "react";
import {
  Filter, Users, Send, Search, CheckSquare, Square,
  Bold, Italic, Strikethrough, Code2,
  Clock, ChevronDown, Zap, Info, Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { leadService } from "@/services/lead.service";
import { campanhaService } from "@/services/campanha.service";
import { funilService } from "@/services/funil.service";

// ─── Constantes ───────────────────────────────────────────────────────────────
const ETAPAS = [
  { value: "",                 label: "Todos os quadros",  cor: "#94a3b8" },
  { value: "novo_cliente",     label: "Novo Cliente",      cor: "#3b82f6" },
  { value: "em_contato",       label: "Em Contato",        cor: "#8b5cf6" },
  { value: "visita_marcada",   label: "Visita Marcada",    cor: "#f59e0b" },
  { value: "proposta_enviada", label: "Proposta Enviada",  cor: "#f97316" },
  { value: "cliente_desistiu", label: "Cliente Desistiu",  cor: "#ef4444" },
];

function formatFone(fone: string) {
  const d = fone.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return fone;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Campanhas() {
  const navigate = useNavigate();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca]               = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [mensagem, setMensagem]         = useState("");
  const [funilId, setFunilId]           = useState("");
  const [intervalo, setIntervalo]       = useState(60);
  const [showEtapas, setShowEtapas]     = useState(false);
  const [showFunis, setShowFunis]       = useState(false);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [isEnviando, setIsEnviando]     = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Dados da API ──────────────────────────────────────────────────────────
  const { data: leadsAll = [], isFetching: leadsLoading } = useQuery({
    queryKey: ["leads-campanha", filtroStatus],
    queryFn: () => leadService.getAll(filtroStatus ? { status: filtroStatus } : undefined),
    staleTime: 0,
  });

  const { data: flows = [] } = useQuery({
    queryKey: ["flows-campanha"],
    queryFn: funilService.listar,
  });

  const { data: flowDetail } = useQuery({
    queryKey: ["flow-detail", funilId],
    queryFn: () => funilService.getById(funilId),
    enabled: !!funilId,
  });

  // Ao carregar detalhe do funil, preenche a mensagem com a primeira etapa de texto
  useEffect(() => {
    if (!flowDetail) return;
    const primeiraEtapa = flowDetail.etapas?.find((e) => e.tipo === "texto");
    if (primeiraEtapa) setMensagem(primeiraEtapa.conteudo);
  }, [flowDetail]);

  // ── Leads visíveis (busca local) ──────────────────────────────────────────
  const leadsVisiveis = useMemo(() => {
    if (!busca.trim()) return leadsAll;
    const q = busca.toLowerCase();
    return leadsAll.filter(
      (l) => l.name.toLowerCase().includes(q) || l.telefone.includes(q)
    );
  }, [leadsAll, busca]);

  const totalSelecionados = selecionados.size;
  const todosVisiveisSelecionados =
    leadsVisiveis.length > 0 && leadsVisiveis.every((l) => selecionados.has(l.id));

  const tempoMin = Math.ceil((totalSelecionados * intervalo) / 60);
  const etapaAtual = ETAPAS.find((e) => e.value === filtroStatus) ?? ETAPAS[0];

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggleLead(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (todosVisiveisSelecionados) {
      setSelecionados((prev) => {
        const next = new Set(prev);
        leadsVisiveis.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelecionados((prev) => {
        const next = new Set(prev);
        leadsVisiveis.forEach((l) => next.add(l.id));
        return next;
      });
    }
  }

  function selecionarFunil(id: string) {
    setFunilId(id);
    setShowFunis(false);
    if (!id) setMensagem("");
  }

  function inserirFormatacao(tag: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = mensagem.slice(start, end);
    const wrap: Record<string, string> = {
      bold:   `*${sel || "texto"}*`,
      italic: `_${sel || "texto"}_`,
      strike: `~${sel || "texto"}~`,
      code:   `\`\`\`${sel || "código"}\`\`\``,
    };
    const novo = mensagem.slice(0, start) + wrap[tag] + mensagem.slice(end);
    setMensagem(novo);
    setTimeout(() => el.focus(), 0);
  }

  function handleEnviarClick() {
    if (totalSelecionados === 0) {
      toast.error("Selecione ao menos um lead");
      return;
    }
    if (!mensagem.trim()) {
      toast.error("Escreva uma mensagem antes de enviar");
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirmar() {
    setIsEnviando(true);
    try {
      const resp = await campanhaService.iniciar({
        leads_ids: Array.from(selecionados),
        mensagem,
        funil_id: funilId || undefined,
        intervalo_segundos: intervalo,
      });
      toast.success(resp.message ?? "Campanha iniciada!");
      navigate(`/dashboard/campanhas/progresso/${resp.id}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        "Erro ao iniciar campanha";
      toast.error(msg);
    } finally {
      setIsEnviando(false);
      setConfirmOpen(false);
    }
  }

  const funilAtualLabel = funilId
    ? (flows.find((f) => f.id === funilId)?.nome ?? "Carregando...")
    : "Mensagem manual";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-[#0f1117]">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-screen overflow-hidden">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-card border-b px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Campanhas
            </h1>
            <p className="text-sm text-muted-foreground">Disparo de mensagens em massa via WhatsApp</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/campanhas/historico")}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Ver histórico
          </button>
        </div>

        {/* ── 3-column layout ─────────────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-3 gap-5 p-5 overflow-hidden">

          {/* ╔══════════════════════════════╗ */}
          {/* ║   COL 1 — Filtrar Kanban     ║ */}
          {/* ╚══════════════════════════════╝ */}
          <div className="rounded-2xl border bg-white dark:bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">1</div>
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white">Filtrar por Kanban</h2>
                    <p className="text-xs text-blue-100">Escolha a etapa do funil</p>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-0 font-bold">
                  {leadsLoading ? "..." : leadsAll.length}
                </Badge>
              </div>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Dropdown Etapa */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Etapa do Funil
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowEtapas((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border
                      bg-background text-sm font-medium hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: etapaAtual.cor }}
                      />
                      {etapaAtual.label}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showEtapas && "rotate-180")} />
                  </button>
                  {showEtapas && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-card
                      border rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
                      {ETAPAS.map((e) => (
                        <button
                          key={e.value}
                          onClick={() => {
                            setFiltroStatus(e.value);
                            setShowEtapas(false);
                            setSelecionados(new Set());
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                            filtroStatus === e.value && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                          )}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} />
                          {e.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contador */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Leads nessa etapa</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {leadsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : leadsAll.length}
                </span>
              </div>

              {/* Info variáveis */}
              <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-3">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Variáveis disponíveis</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400/80">
                      <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">{"{nome}"}</code> — nome do lead
                      <br />
                      <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">{"{interesse}"}</code> — interesse do lead
                    </p>
                  </div>
                </div>
              </div>

              {/* Acesso rápido */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acesso rápido</p>
                <div className="flex flex-wrap gap-2">
                  {ETAPAS.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => { setFiltroStatus(e.value); setSelecionados(new Set()); }}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                        filtroStatus === e.value
                          ? "text-white border-transparent"
                          : "bg-background border-border text-muted-foreground hover:border-gray-300"
                      )}
                      style={filtroStatus === e.value ? { backgroundColor: e.cor } : {}}
                    >
                      {e.value === "" ? "Todos" : e.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ╔══════════════════════════════╗ */}
          {/* ║   COL 2 — Selecionar Leads   ║ */}
          {/* ╚══════════════════════════════╝ */}
          <div className="rounded-2xl border bg-white dark:bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">2</div>
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white">Selecionar Leads</h2>
                    <p className="text-xs text-purple-100">
                      {totalSelecionados} de {leadsAll.length} selecionados
                    </p>
                  </div>
                </div>
                {totalSelecionados > 0 && (
                  <Badge className="bg-white/20 text-white border-0 font-bold">{totalSelecionados} ✓</Badge>
                )}
              </div>
            </div>

            {/* Search + Selecionar todos */}
            <div className="p-4 space-y-2 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou WhatsApp..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <button
                onClick={toggleTodos}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  todosVisiveisSelecionados
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 text-purple-700 dark:text-purple-400"
                    : "bg-background hover:bg-muted/40 text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {todosVisiveisSelecionados
                    ? <CheckSquare className="w-4 h-4 text-purple-500" />
                    : <Square className="w-4 h-4 text-muted-foreground" />
                  }
                  {todosVisiveisSelecionados ? "Desmarcar todos" : "Selecionar todos"}
                </div>
                <Badge variant="secondary" className="font-semibold">
                  {leadsVisiveis.length} lead{leadsVisiveis.length !== 1 ? "s" : ""}
                </Badge>
              </button>
            </div>

            {/* Lista de leads */}
            <div className="flex-1 overflow-y-auto divide-y">
              {leadsLoading ? (
                <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : leadsVisiveis.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum lead encontrado</p>
                </div>
              ) : leadsVisiveis.map((lead) => {
                const sel = selecionados.has(lead.id);
                return (
                  <button
                    key={lead.id}
                    onClick={() => toggleLead(lead.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                      sel && "bg-purple-50 dark:bg-purple-900/10"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                      sel ? "bg-purple-500 border-purple-500" : "border-gray-300 dark:border-gray-600"
                    )}>
                      {sel && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFone(lead.telefone)}</p>
                    </div>
                    {lead.temperatura === 3 && <span className="text-base flex-shrink-0">🔥</span>}
                    {lead.temperatura === 2 && <span className="text-base flex-shrink-0">⛅</span>}
                    {lead.temperatura === 1 && <span className="text-base flex-shrink-0">❄️</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ╔══════════════════════════════╗ */}
          {/* ║   COL 3 — Compor Mensagem    ║ */}
          {/* ╚══════════════════════════════╝ */}
          <div className="rounded-2xl border bg-white dark:bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">3</div>
                <div className="p-1.5 rounded-lg bg-white/20">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">Compor Mensagem</h2>
                  <p className="text-xs text-green-100">Use um funil ou escreva livremente</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Usar Funil */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Usar Funil
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowFunis((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border
                      bg-background text-sm font-medium hover:border-green-300 transition-colors"
                  >
                    {funilAtualLabel}
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showFunis && "rotate-180")} />
                  </button>
                  {showFunis && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-card
                      border rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => selecionarFunil("")}
                        className={cn(
                          "w-full flex items-center px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left",
                          !funilId && "bg-green-50 dark:bg-green-900/20 text-green-600 font-medium"
                        )}
                      >
                        Mensagem manual
                      </button>
                      {flows.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => selecionarFunil(f.id)}
                          className={cn(
                            "w-full flex items-center px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left",
                            funilId === f.id && "bg-green-50 dark:bg-green-900/20 text-green-600 font-medium"
                          )}
                        >
                          {f.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mensagem de texto */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mensagem de Texto
                </label>
                <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/30">
                  {([
                    { tag: "bold",   icon: Bold,          title: "Negrito (*texto*)" },
                    { tag: "italic", icon: Italic,        title: "Itálico (_texto_)" },
                    { tag: "strike", icon: Strikethrough, title: "Tachado (~texto~)" },
                    { tag: "code",   icon: Code2,         title: "Código (```código```)" },
                  ]).map(({ tag, icon: Icon, title }) => (
                    <button
                      key={tag}
                      onClick={() => inserirFormatacao(tag)}
                      title={title}
                      className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground px-2">{mensagem.length} chars</span>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder={"Digite sua mensagem...\n\nExemplo: Olá {nome}! Tenho uma proposta sobre {interesse}."}
                  className="min-h-[140px] resize-none text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Use{" "}
                  <code className="bg-muted px-1 rounded">{"{nome}"}</code> e{" "}
                  <code className="bg-muted px-1 rounded">{"{interesse}"}</code>{" "}
                  para personalizar a mensagem por lead.
                </p>
              </div>

              {/* Intervalo anti-ban */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Intervalo anti-ban
                  </label>
                  <span className="text-sm font-bold text-blue-500">{intervalo}s</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={3600}
                  step={15}
                  value={intervalo}
                  onChange={(e) => setIntervalo(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30s</span>
                  <span>30min</span>
                  <span>1h</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  ≈ {tempoMin} min para {totalSelecionados} lead{totalSelecionados !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* ── Rodapé: botão enviar ─────────────────────────────────────── */}
            <div className="p-4 border-t bg-gray-50 dark:bg-muted/10 flex-shrink-0">
              <button
                onClick={handleEnviarClick}
                disabled={totalSelecionados === 0 || !mensagem.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                  totalSelecionados > 0 && mensagem.trim()
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 active:scale-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                Enviar para {totalSelecionados} lead{totalSelecionados !== 1 ? "s" : ""}
              </button>
              {totalSelecionados > 0 && mensagem.trim() && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Tempo estimado: ≈ {tempoMin} min com intervalo de {intervalo}s
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal de confirmação ───────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              Você vai enviar mensagens para{" "}
              <span className="font-bold text-foreground">{totalSelecionados} leads</span>.
            </p>
            <p>
              Tempo estimado:{" "}
              <span className="font-bold text-foreground">≈ {tempoMin} minutos</span>{" "}
              com intervalo de <span className="font-bold text-foreground">{intervalo}s</span> entre cada envio.
            </p>
            <p className="text-xs">
              Isso evita bloqueio do WhatsApp por disparo em massa.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isEnviando}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmar} disabled={isEnviando} className="bg-blue-500 hover:bg-blue-600">
              {isEnviando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Confirmar e Disparar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
