import { useState, useMemo, useRef } from "react";
import {
  Filter, Users, Send, Search, CheckSquare, Square,
  Image, Video, Mic, Bold, Italic, Strikethrough, Code2,
  Clock, ChevronDown, Wifi, Info, Zap,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/services/lead.service";

// ─── Constantes ───────────────────────────────────────────────────────────────
const ETAPAS = [
  { value: "todos",    label: "Todos os quadros",     cor: "#94a3b8" },
  { value: "novo",     label: "Novo Cliente",          cor: "#3b82f6" },
  { value: "contato",  label: "Em Contato",            cor: "#8b5cf6" },
  { value: "Visista",  label: "Visita Marcada",        cor: "#f59e0b" },
  { value: "Proposta", label: "Proposta Enviada",      cor: "#f97316" },
  { value: "desistiu", label: "Cliente Desistiu",      cor: "#ef4444" },
  { value: "bolsao",   label: "Bolsão",                cor: "#22c55e" },
];

const FUNIS = [
  { value: "manual",     label: "Mensagem manual" },
  { value: "prospeccao", label: "Prospecção Inicial" },
  { value: "followup",   label: "Follow-up de Visita" },
  { value: "proposta",   label: "Apresentação de Proposta" },
  { value: "reativacao", label: "Reativação de Lead" },
];

const TEMPLATES: Record<string, string> = {
  prospeccao: "Olá {nome}! Tudo bem? 😊 Vi que você tem interesse em imóveis. Tenho uma oportunidade {incrível|especial|exclusiva} que pode te interessar! Posso te apresentar?",
  followup:   "Oi {nome}! {Como foi a visita|O que achou do imóvel|Você gostou} que fizemos juntos? Fico à disposição para tirar {qualquer dúvida|suas dúvidas}! 😊",
  proposta:   "Olá {nome}! Preparei uma {proposta especial|oferta exclusiva|apresentação} do imóvel para você. Quando podemos {conversar|bater um papo|falar}?",
  reativacao: "Oi {nome}! Faz um tempo que não nos falamos. {Surgiram novas oportunidades|Chegaram imóveis novos|Temos novidades} que podem te interessar! 🏠",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFone(fone: string) {
  const d = fone.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return fone;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Campanhas() {
  const { data: leadsAll = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadService.getAll(),
  });

  const [filtroStatus, setFiltroStatus]     = useState("todos");
  const [busca, setBusca]                   = useState("");
  const [selecionados, setSelecionados]     = useState<Set<string>>(new Set());
  const [mensagem, setMensagem]             = useState("");
  const [funil, setFunil]                   = useState("manual");
  const [intervalo, setIntervalo]           = useState(5);
  const [midiaAtiva, setMidiaAtiva]         = useState<"imagem" | "video" | "audio" | null>(null);
  const [showEtapas, setShowEtapas]         = useState(false);
  const [showFunis, setShowFunis]           = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Leads filtrados pelo estágio
  const leadsFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return leadsAll;
    return leadsAll.filter(l => l.status === filtroStatus);
  }, [leadsAll, filtroStatus]);

  // Leads filtrados + busca
  const leadsVisiveis = useMemo(() => {
    if (!busca.trim()) return leadsFiltrados;
    const q = busca.toLowerCase();
    return leadsFiltrados.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.telefone.includes(q)
    );
  }, [leadsFiltrados, busca]);

  const totalSelecionados = selecionados.size;
  const todosVisiveisSelecionados = leadsVisiveis.length > 0 &&
    leadsVisiveis.every(l => selecionados.has(l.id));

  function toggleLead(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (todosVisiveisSelecionados) {
      setSelecionados(prev => {
        const next = new Set(prev);
        leadsVisiveis.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      setSelecionados(prev => {
        const next = new Set(prev);
        leadsVisiveis.forEach(l => next.add(l.id));
        return next;
      });
    }
  }

  function selecionarFunil(value: string) {
    setFunil(value);
    setShowFunis(false);
    if (value !== "manual" && TEMPLATES[value]) {
      setMensagem(TEMPLATES[value]);
    }
  }

  function inserirFormatacao(tag: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = mensagem.slice(start, end);
    const wrap: Record<string, string> = {
      bold: `*${sel || "texto"}*`,
      italic: `_${sel || "texto"}_`,
      strike: `~${sel || "texto"}~`,
      code: `\`\`\`${sel || "código"}\`\`\``,
    };
    const novo = mensagem.slice(0, start) + wrap[tag] + mensagem.slice(end);
    setMensagem(novo);
    setTimeout(() => el.focus(), 0);
  }

  const tempoMin  = Math.ceil((totalSelecionados * intervalo) / 60);
  const etapaAtual = ETAPAS.find(e => e.value === filtroStatus)!;
  const funilAtual  = FUNIS.find(f => f.value === funil)!;

  function handleEnviar() {
    if (totalSelecionados === 0) {
      toast.error("Selecione ao menos um lead");
      return;
    }
    if (!mensagem.trim()) {
      toast.error("Escreva uma mensagem antes de enviar");
      return;
    }
    toast.info(`Envio iniciado para ${totalSelecionados} lead${totalSelecionados !== 1 ? "s" : ""}`, {
      description: "Funcionalidade de disparo será integrada ao backend em breve.",
    });
  }

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
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Instância conectada
            </span>
          </div>
        </div>

        {/* ── 3-column layout ─────────────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-3 gap-5 p-5 overflow-hidden">

          {/* ╔══════════════════════════════╗ */}
          {/* ║   COL 1 — Filtrar Kanban     ║ */}
          {/* ╚══════════════════════════════╝ */}
          <div className="rounded-2xl border bg-white dark:bg-card shadow-sm flex flex-col overflow-hidden">
            {/* Header colorido azul */}
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
                <Badge className="bg-white/20 text-white border-0 font-bold">{leadsFiltrados.length}</Badge>
              </div>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Dropdown Quadro */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Quadro (Ação)
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowEtapas(v => !v)}
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
                      {ETAPAS.map(e => (
                        <button
                          key={e.value}
                          onClick={() => { setFiltroStatus(e.value); setShowEtapas(false); setSelecionados(new Set()); }}
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

              {/* Contagem de leads filtrados */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Leads nessa etapa</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{leadsFiltrados.length}</span>
              </div>

              {/* Info sobre variações */}
              <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-3">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Anti-Spam ativo</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400/80">
                      Use <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">{"{var1|var2|var3}"}</code> na mensagem para gerar variações automáticas e evitar bloqueio pelo Meta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Etapas quick select */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acesso rápido</p>
                <div className="flex flex-wrap gap-2">
                  {ETAPAS.map(e => (
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
                      {e.value === "todos" ? "Todos" : e.label.split(" ")[0]}
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
            {/* Header colorido roxo */}
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
                      {totalSelecionados} de {leadsFiltrados.length} selecionados
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
                  onChange={e => setBusca(e.target.value)}
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
                  {todosVisiveisSelecionados ? "Desmarcar todos" : "Selecionar"}
                </div>
                <Badge variant="secondary" className="font-semibold">
                  {leadsVisiveis.length} lead{leadsVisiveis.length !== 1 ? "s" : ""}
                </Badge>
              </button>
            </div>

            {/* Lista de leads */}
            <div className="flex-1 overflow-y-auto divide-y">
              {leadsVisiveis.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum lead encontrado</p>
                </div>
              ) : leadsVisiveis.map(lead => {
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
                      sel
                        ? "bg-purple-500 border-purple-500"
                        : "border-gray-300 dark:border-gray-600"
                    )}>
                      {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>}
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
            {/* Header colorido verde */}
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
                    onClick={() => setShowFunis(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border
                      bg-background text-sm font-medium hover:border-green-300 transition-colors"
                  >
                    {funilAtual.label}
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showFunis && "rotate-180")} />
                  </button>
                  {showFunis && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-card
                      border rounded-lg shadow-lg py-1">
                      {FUNIS.map(f => (
                        <button
                          key={f.value}
                          onClick={() => selecionarFunil(f.value)}
                          className={cn(
                            "w-full flex items-center px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left",
                            funil === f.value && "bg-green-50 dark:bg-green-900/20 text-green-600 font-medium"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Anexar Mídia */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Anexar Mídia
                </label>
                <div className="flex gap-2">
                  {([
                    { tipo: "imagem" as const, icon: Image,  label: "Imagem" },
                    { tipo: "video"  as const, icon: Video,  label: "Vídeo" },
                    { tipo: "audio"  as const, icon: Mic,    label: "Áudio" },
                  ]).map(({ tipo, icon: Icon, label }) => (
                    <button
                      key={tipo}
                      onClick={() => setMidiaAtiva(midiaAtiva === tipo ? null : tipo)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all",
                        midiaAtiva === tipo
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-background hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                {midiaAtiva && (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed
                    border-blue-300 dark:border-blue-700 text-sm text-blue-500 cursor-pointer
                    hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                    <input type="file"
                      accept={midiaAtiva === "imagem" ? "image/*" : midiaAtiva === "video" ? "video/*" : "audio/*"}
                      className="hidden"
                      onChange={() => toast.info("Upload disponível após integração com backend")}
                    />
                    Clique para selecionar {midiaAtiva === "imagem" ? "uma imagem" : midiaAtiva === "video" ? "um vídeo" : "um áudio"}
                  </label>
                )}
              </div>

              {/* Mensagem de texto */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mensagem de Texto
                </label>
                {/* Toolbar de formatação */}
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
                  onChange={e => setMensagem(e.target.value)}
                  placeholder={"Digite sua mensagem...\n\nDica: use {opção1|opção2} para variações anti-spam"}
                  className="min-h-[140px] resize-none text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{"{texto1|texto2|texto3}"}</code> para rotacionar variações e evitar spam
                </p>
              </div>

              {/* Intervalo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Intervalo entre envios
                  </label>
                  <span className="text-sm font-bold text-blue-500">{intervalo}s</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={60}
                  step={1}
                  value={intervalo}
                  onChange={e => setIntervalo(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3s (rápido)</span>
                  <span>30s</span>
                  <span>60s (seguro)</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  ≈ {tempoMin === 0 ? "0" : tempoMin} min para {totalSelecionados} lead{totalSelecionados !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* ── Rodapé: botão enviar ─────────────────────────────────────── */}
            <div className="p-4 border-t bg-gray-50 dark:bg-muted/10 flex-shrink-0">
              <button
                onClick={handleEnviar}
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
    </div>
  );
}
