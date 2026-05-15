import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { funilService, type EtapaTipo } from "@/services/funil.service";
import {
  ArrowLeft, Plus, Trash2, GripVertical,
  Type, Image, Video, Mic, Save, Loader2,
  ChevronDown, Upload, Zap, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos locais ─────────────────────────────────────────────────────────────
interface EtapaLocal {
  _id: string;
  id?: string;
  tipo: EtapaTipo;
  conteudo: string;
  intervalo_antes: number;
  arquivo?: File;
  previewUrl?: string;
  uploadando?: boolean;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Configurações por tipo ───────────────────────────────────────────────────
const TIPO_CONFIG: Record<EtapaTipo, {
  label: string;
  cor: string;
  bgHeader: string;
  icon: React.ReactNode;
  accept?: string;
}> = {
  texto: {
    label: "Texto",
    cor: "text-amber-600",
    bgHeader: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800",
    icon: <Type className="w-3.5 h-3.5" />,
  },
  imagem: {
    label: "Imagem",
    cor: "text-green-600",
    bgHeader: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
    icon: <Image className="w-3.5 h-3.5" />,
    accept: "image/*",
  },
  video: {
    label: "Vídeo",
    cor: "text-blue-600",
    bgHeader: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
    icon: <Video className="w-3.5 h-3.5" />,
    accept: "video/*",
  },
  audio: {
    label: "Áudio",
    cor: "text-purple-600",
    bgHeader: "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800",
    icon: <Mic className="w-3.5 h-3.5" />,
    accept: "audio/*",
  },
};

// ─── Preview WhatsApp ─────────────────────────────────────────────────────────
function WppBubble({ etapa }: { etapa: EtapaLocal }) {
  const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-[#d9fdd3] dark:bg-[#005c4b] rounded-l-2xl rounded-br-2xl rounded-tr-sm px-3 py-2 shadow-sm">
        {etapa.tipo === "texto" && (
          <p className="text-[13px] text-[#111b21] dark:text-white whitespace-pre-wrap break-words">
            {etapa.conteudo || <span className="italic text-[#667781]">mensagem vazia</span>}
          </p>
        )}
        {etapa.tipo === "imagem" && (
          <div className="rounded-lg overflow-hidden mb-1 max-w-[160px]">
            {etapa.previewUrl ? (
              <img src={etapa.previewUrl} alt="preview" className="w-full object-cover" />
            ) : etapa.conteudo ? (
              <img src={etapa.conteudo} alt="preview" className="w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-full h-20 bg-[#e9edef] dark:bg-[#2a3942] flex items-center justify-center">
                <Image className="w-6 h-6 text-[#8696a0]" />
              </div>
            )}
          </div>
        )}
        {etapa.tipo === "video" && (
          <div className="flex items-center gap-2 py-1">
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-[#667781] dark:text-[#8696a0]">
              {etapa.arquivo?.name ?? (etapa.conteudo ? "vídeo" : "sem arquivo")}
            </span>
          </div>
        )}
        {etapa.tipo === "audio" && (
          <div className="flex items-center gap-2 py-1 min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 h-1 bg-[#8696a0] rounded-full" />
          </div>
        )}
        <p className="text-[10px] text-[#667781] dark:text-[#8696a0] text-right mt-1 flex items-center justify-end gap-1">
          {agora}
          <svg viewBox="0 0 16 11" className="w-3.5 h-3.5 fill-[#4fc3f7]">
            <path d="M11.071.653a.75.75 0 0 1 1.179.928l-5.5 7a.75.75 0 0 1-1.14.05l-3-3a.75.75 0 0 1 1.06-1.06l2.41 2.41 4.99-6.328Z"/>
            <path d="M14.071.653a.75.75 0 0 1 1.179.928l-5.5 7a.75.75 0 0 1-1.06.05.75.75 0 0 1 0-1.06l5.381-6.918Z" opacity=".5"/>
          </svg>
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FunilEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [nome, setNome]                   = useState("");
  const [descricao, setDescricao]         = useState("");
  const [etapas, setEtapas]               = useState<EtapaLocal[]>([]);
  const [showAddMenu, setShowAddMenu]     = useState(false);
  const [dragIndex, setDragIndex]         = useState<number | null>(null);
  const [dragOver, setDragOver]           = useState<number | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // ── Carregar funil existente ─────────────────────────────────────────────────
  const { isLoading: carregando } = useQuery({
    queryKey: ["funil-edit", id],
    queryFn: () => funilService.getById(id!),
    enabled: isEditing,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (!isEditing) return;
    funilService.getById(id!).then((funil) => {
      setNome(funil.nome);
      setDescricao(funil.descricao ?? "");
      setEtapas(
        (funil.etapas ?? [])
          .sort((a, b) => a.ordem - b.ordem)
          .map((e) => ({
            _id: genId(),
            id: e.id,
            tipo: e.tipo,
            conteudo: e.conteudo,
            intervalo_antes: e.intervalo_antes,
          }))
      );
    }).catch(() => toast.error("Erro ao carregar funil"));
  }, [id]);

  // ── Fechar menu ao clicar fora ───────────────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const salvarMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        etapas: etapas.map((e, i) => ({
          tipo: e.tipo,
          conteudo: e.conteudo,
          ordem: i,
          intervalo_antes: e.intervalo_antes,
        })),
      };
      if (isEditing) return funilService.atualizar(id!, payload);
      return funilService.criar(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funis"] });
      toast.success(isEditing ? "Funil atualizado!" : "Funil criado!");
      navigate("/dashboard/funis");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message ?? "Erro ao salvar funil";
      toast.error(msg);
    },
  });

  // ── Handlers de etapas ───────────────────────────────────────────────────────
  function adicionarEtapa(tipo: EtapaTipo) {
    setEtapas((prev) => [
      ...prev,
      { _id: genId(), tipo, conteudo: "", intervalo_antes: 0 },
    ]);
    setShowAddMenu(false);
  }

  function removerEtapa(_id: string) {
    setEtapas((prev) => prev.filter((e) => e._id !== _id));
  }

  function atualizarEtapa(_id: string, patch: Partial<EtapaLocal>) {
    setEtapas((prev) => prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)));
  }

  async function handleArquivo(_id: string, file: File) {
    const previewUrl = URL.createObjectURL(file);
    atualizarEtapa(_id, { arquivo: file, previewUrl, uploadando: true });
    try {
      const url = await funilService.uploadMidia(file);
      atualizarEtapa(_id, { conteudo: url, uploadando: false });
    } catch {
      atualizarEtapa(_id, { uploadando: false });
      toast.error("Erro ao fazer upload. A URL da mídia ficará vazia.");
    }
  }

  // ── Drag and Drop ────────────────────────────────────────────────────────────
  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOver(index);
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOver(null);
      return;
    }
    setEtapas((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setDragOver(null);
  }

  // ── Validação ────────────────────────────────────────────────────────────────
  function podeeSalvar() {
    return nome.trim().length > 0 && etapas.length > 0;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (isEditing && carregando) {
    return (
      <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-[#0f1117]">
        <Sidebar />
        <main className="flex-1 ml-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-[#0f1117]">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-white dark:bg-card border-b px-6 py-4 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => navigate("/dashboard/funis")}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              {isEditing ? "Editar Funil" : "Novo Funil"}
            </h1>
            <p className="text-sm text-muted-foreground">Configure as etapas do funil de disparo</p>
          </div>
          <Button
            onClick={() => salvarMutation.mutate()}
            disabled={!podeeSalvar() || salvarMutation.isPending}
            className="bg-emerald-500 hover:bg-emerald-600 gap-2"
          >
            {salvarMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Funil
          </Button>
        </div>

        {/* Body — 2 colunas */}
        <div className="flex-1 grid grid-cols-[1fr_340px] overflow-hidden">

          {/* ── Col 1: Editor ─────────────────────────────────────────────── */}
          <div className="overflow-y-auto p-6 space-y-5">

            {/* Nome + Descrição */}
            <div className="rounded-2xl border bg-white dark:bg-card shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nome do Funil <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Prospecção Inicial"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Descrição
                  </label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Primeiro contato com novos leads"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            {/* Header Etapas */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Etapas do Funil
                <Badge variant="secondary" className="font-bold">{etapas.length}</Badge>
              </h2>

              {/* Botão Adicionar */}
              <div className="relative" ref={addMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMenu((v) => !v)}
                  className="gap-1.5 border-dashed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Etapa
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAddMenu && "rotate-180")} />
                </Button>
                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-card border rounded-xl shadow-lg py-1.5 w-44">
                    {(Object.keys(TIPO_CONFIG) as EtapaTipo[]).map((tipo) => {
                      const cfg = TIPO_CONFIG[tipo];
                      return (
                        <button
                          key={tipo}
                          onClick={() => adicionarEtapa(tipo)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-muted/50 transition-colors",
                            cfg.cor
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Etapas */}
            {etapas.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-muted p-10 text-center text-muted-foreground">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Clique em "Adicionar Etapa" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {etapas.map((etapa, index) => {
                  const cfg = TIPO_CONFIG[etapa.tipo];
                  return (
                    <div
                      key={etapa._id}
                      draggable
                      onDragStart={() => onDragStart(index)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDrop={() => onDrop(index)}
                      onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                      className={cn(
                        "rounded-2xl border bg-white dark:bg-card shadow-sm overflow-hidden transition-all",
                        dragOver === index && dragIndex !== index && "border-emerald-400 scale-[1.01]",
                        dragIndex === index && "opacity-50"
                      )}
                    >
                      {/* Step header */}
                      <div className={cn("flex items-center gap-3 px-4 py-2.5 border-b", cfg.bgHeader)}>
                        <div
                          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          title="Arraste para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className={cn("flex items-center gap-1.5 text-xs font-semibold flex-1", cfg.cor)}>
                          {cfg.icon}
                          Etapa {index + 1}: {cfg.label}
                        </div>
                        <button
                          onClick={() => removerEtapa(etapa._id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Step content */}
                      <div className="p-4 space-y-3">
                        {etapa.tipo === "texto" && (
                          <Textarea
                            value={etapa.conteudo}
                            onChange={(e) => atualizarEtapa(etapa._id, { conteudo: e.target.value })}
                            placeholder={"Digite a mensagem...\n\nUse {nome} e {interesse} para personalizar."}
                            className="min-h-[100px] resize-none text-sm"
                          />
                        )}

                        {etapa.tipo !== "texto" && (
                          <div className="space-y-2">
                            {/* Preview da mídia */}
                            {etapa.tipo === "imagem" && (etapa.previewUrl || etapa.conteudo) && (
                              <img
                                src={etapa.previewUrl ?? etapa.conteudo}
                                alt="preview"
                                className="rounded-lg max-h-40 object-cover border"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            {etapa.tipo === "video" && etapa.previewUrl && (
                              <video src={etapa.previewUrl} className="rounded-lg max-h-32 border" controls />
                            )}
                            {etapa.tipo === "audio" && etapa.previewUrl && (
                              <audio src={etapa.previewUrl} className="w-full" controls />
                            )}

                            {/* Upload */}
                            <label className={cn(
                              "flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-sm cursor-pointer transition-colors",
                              etapa.uploadando
                                ? "opacity-60 pointer-events-none"
                                : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                            )}>
                              <input
                                type="file"
                                accept={cfg.accept}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleArquivo(etapa._id, file);
                                }}
                              />
                              {etapa.uploadando ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  {etapa.arquivo ? "Trocar arquivo" : `Selecionar ${cfg.label.toLowerCase()}`}
                                </>
                              )}
                            </label>

                            {/* Ou URL direta */}
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Ou cole uma URL:</label>
                              <Input
                                value={etapa.conteudo}
                                onChange={(e) => atualizarEtapa(etapa._id, { conteudo: e.target.value, previewUrl: undefined, arquivo: undefined })}
                                placeholder={`https://... (URL da ${cfg.label.toLowerCase()})`}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Intervalo antes desta etapa */}
                        {index > 0 && (
                          <div className="flex items-center gap-3 pt-1">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">
                              Intervalo antes:
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={300}
                              step={5}
                              value={etapa.intervalo_antes}
                              onChange={(e) => atualizarEtapa(etapa._id, { intervalo_antes: Number(e.target.value) })}
                              className="flex-1 accent-emerald-500"
                            />
                            <span className="text-xs font-bold text-emerald-600 w-8 text-right">
                              {etapa.intervalo_antes}s
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Col 2: Preview WhatsApp ────────────────────────────────────── */}
          <div className="border-l bg-white dark:bg-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold">Pré-visualização</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {etapas.length} etapa{etapas.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Simulação do WhatsApp */}
            <div className="flex-1 flex flex-col overflow-hidden"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23e5ddd5'/%3E%3C/svg%3E\")" }}
            >
              {/* Header fake do WhatsApp */}
              <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#128c7e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {nome ? nome.slice(0, 2).toUpperCase() : "FN"}
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{nome || "Nome do Funil"}</p>
                  <p className="text-[#b2dfdb] text-[11px]">online</p>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {etapas.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-[#667781] bg-white/60 px-3 py-2 rounded-full">
                      Adicione etapas para ver o preview
                    </p>
                  </div>
                ) : (
                  etapas.map((etapa, i) => (
                    <div key={etapa._id}>
                      {etapa.intervalo_antes > 0 && i > 0 && (
                        <div className="flex justify-center my-1">
                          <span className="text-[10px] bg-white/60 px-2 py-0.5 rounded-full text-[#667781]">
                            aguarda {etapa.intervalo_antes}s
                          </span>
                        </div>
                      )}
                      <WppBubble etapa={etapa} />
                    </div>
                  ))
                )}
              </div>

              {/* Input fake */}
              <div className="bg-[#f0f2f5] dark:bg-[#1f2c34] px-3 py-2 flex items-center gap-2 flex-shrink-0">
                <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 text-xs text-[#8696a0]">
                  Digite uma mensagem
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
