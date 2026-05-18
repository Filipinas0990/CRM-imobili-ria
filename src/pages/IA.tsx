import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { iaService, IARegra } from "@/services/ia.service";
import {
  Bot, Power, MessageSquare, Shield,
  Plus, Trash2, Loader2, CheckCircle,
  AlertCircle, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_PADRAO = `Você é um assistente virtual inteligente de uma imobiliária. Seu objetivo é:
1. Entender o que o cliente procura (tipo de imóvel, localização, faixa de preço)
2. Apresentar opções de imóveis disponíveis com fotos e informações
3. Agendar visitas quando o cliente demonstrar interesse
4. Conduzir o cliente pelo funil de vendas de forma natural e consultiva
5. Se o cliente pedir atendente humano ou parecer confuso/frustrado, transferir para um humano

Regras importantes:
- Seja cordial, profissional e objetivo
- Use emojis moderadamente para tornar a conversa mais amigável
- Sempre apresente informações reais dos imóveis (nunca invente dados)
- Quando perguntar algo, faça uma pergunta por vez`;

const STATUS_OPTIONS = [
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "fechado", label: "Fechado" },
  { value: "pendente", label: "Pendente" },
];

interface Config {
  ativo: boolean;
  instancias: string[];
  prompt_sistema: string;
  regras: IARegra[];
}

const DEFAULT_CONFIG: Config = {
  ativo: false,
  instancias: [],
  prompt_sistema: PROMPT_PADRAO,
  regras: [],
};

export default function IA() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [novaRegra, setNovaRegra] = useState<IARegra>({
    palavra_chave: "",
    novo_status: "em_atendimento",
    pausar_ia: true,
  });

  const { data: iaConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["ia-config"],
    queryFn: iaService.getConfig,
  });

  useEffect(() => {
    if (iaConfig) {
      setConfig({
        ativo: iaConfig.ativo ?? false,
        instancias: iaConfig.instancias ?? [],
        prompt_sistema: iaConfig.prompt_sistema ?? PROMPT_PADRAO,
        regras: iaConfig.regras ?? [],
      });
    }
  }, [iaConfig]);

  const { data: instancias = [], isLoading: loadingInstancias } = useQuery({
    queryKey: ["ia-instancias"],
    queryFn: iaService.getInstancias,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      iaService.saveConfig({
        ativo: config.ativo,
        instancias: config.instancias,
        prompt_sistema: config.prompt_sistema,
        regras: config.regras,
      }),
    onSuccess: () => toast.success("Configurações salvas com sucesso!"),
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error ??
        "Erro ao salvar configurações";
      toast.error(msg);
    },
  });

  const toggleInstancia = (name: string) => {
    setConfig((prev) => {
      const exists = prev.instancias.includes(name);
      return {
        ...prev,
        instancias: exists
          ? prev.instancias.filter((i) => i !== name)
          : [...prev.instancias, name],
      };
    });
  };

  const adicionarRegra = () => {
    if (!novaRegra.palavra_chave.trim()) return;
    setConfig((prev) => ({
      ...prev,
      regras: [...prev.regras, { ...novaRegra }],
    }));
    setNovaRegra({ palavra_chave: "", novo_status: "em_atendimento", pausar_ia: true });
  };

  const removerRegra = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      regras: prev.regras.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-[#0f1117]">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-white dark:bg-card border-b px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-violet-500" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Inteligência Artificial</h1>
              <p className="text-xs text-muted-foreground">
                Configure o assistente de IA para atendimento automático
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium px-3 py-1",
              config.ativo
                ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                : "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400"
            )}
          >
            {config.ativo ? "Ativa" : "Inativa"}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingConfig ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">

              {/* 1. Toggle Ativar */}
              <div className="bg-white dark:bg-card border rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Power className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Ativar Assistente de I.A.</p>
                    <p className="text-xs text-muted-foreground">
                      Quando ativada, a IA responde automaticamente mensagens de clientes no WhatsApp
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.ativo}
                  onCheckedChange={(v) => setConfig((prev) => ({ ...prev, ativo: v }))}
                />
              </div>

              {/* 2. Instâncias de WhatsApp */}
              <div className="bg-white dark:bg-card border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Instâncias de WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Selecione em quais instâncias a IA deve atuar. Se nenhuma for selecionada,
                      a IA ficará ativa em todas as instâncias da empresa.
                    </p>
                  </div>
                </div>

                {config.instancias.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    IA ativa em todas as instâncias
                  </div>
                )}

                <div className="space-y-2">
                  {loadingInstancias ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando instâncias...
                    </div>
                  ) : instancias.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma instância encontrada.</p>
                  ) : (
                    instancias
                      .filter((inst) => inst?.instance?.instanceName)
                      .map((inst) => {
                        const name = inst.instance.instanceName;
                        const isConnected = inst.instance.state === "open";
                        const isChecked = config.instancias.includes(name);
                        return (
                          <label
                            key={name}
                            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleInstancia(name)}
                            />
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                isConnected ? "bg-green-500" : "bg-red-500"
                              )}
                            />
                            <Smartphone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm flex-1">{name}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                isConnected
                                  ? "border-green-500 text-green-600 dark:text-green-400"
                                  : "border-red-500 text-red-600 dark:text-red-400"
                              )}
                            >
                              {isConnected ? "Conectada" : "Desconectada"}
                            </Badge>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              {/* 3. Prompt do Sistema */}
              <div className="bg-white dark:bg-card border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Prompt do Sistema</p>
                    <p className="text-xs text-muted-foreground">
                      Define o comportamento e personalidade da IA. Ela usará este prompt como
                      base para todas as conversas.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={config.prompt_sistema}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, prompt_sistema: e.target.value }))
                    }
                    rows={8}
                    className="resize-y text-sm font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, prompt_sistema: PROMPT_PADRAO }))
                      }
                    >
                      Restaurar Padrão
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {(config.prompt_sistema ?? "").length} caracteres
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Regras de Resposta */}
              <div className="bg-white dark:bg-card border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Regras de Resposta da I.A.</p>
                    <p className="text-xs text-muted-foreground">
                      Configure palavras-chave que, quando detectadas na resposta da I.A.,
                      alteram automaticamente o status do chat. Exemplo: se a I.A. responder
                      "vou verificar", o chat pode ser movido para "Em atendimento".
                    </p>
                  </div>
                </div>

                {/* Linha de adição */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    placeholder="Palavra-chave (ex: verificar)"
                    value={novaRegra.palavra_chave}
                    onChange={(e) =>
                      setNovaRegra((prev) => ({ ...prev, palavra_chave: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && adicionarRegra()}
                    className="flex-1 min-w-[180px]"
                  />
                  <Select
                    value={novaRegra.novo_status}
                    onValueChange={(v) =>
                      setNovaRegra((prev) => ({
                        ...prev,
                        novo_status: v as IARegra["novo_status"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={novaRegra.pausar_ia}
                      onCheckedChange={(v) =>
                        setNovaRegra((prev) => ({ ...prev, pausar_ia: v }))
                      }
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Pausar I.A.
                    </span>
                  </div>
                  <Button size="sm" onClick={adicionarRegra} className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>

                {/* Lista de regras */}
                <div className="border rounded-lg overflow-hidden">
                  {config.regras.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma regra configurada. Adicione palavras-chave acima.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {config.regras.map((regra, i) => {
                        const statusLabel =
                          STATUS_OPTIONS.find((s) => s.value === regra.novo_status)?.label ??
                          regra.novo_status;
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <span className="text-sm font-medium flex-1">
                              "{regra.palavra_chave}"
                            </span>
                            <span className="text-xs text-muted-foreground">→</span>
                            <Badge variant="secondary" className="text-xs">
                              {statusLabel}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  regra.pausar_ia ? "bg-green-500" : "bg-gray-300"
                                )}
                              />
                              <span className="text-xs text-muted-foreground">Pausar</span>
                            </div>
                            <button
                              onClick={() => removerRegra(i)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Como Funciona (estático) */}
              <div className="bg-white dark:bg-card border rounded-xl p-5 space-y-4">
                <p className="font-medium text-foreground">Como funciona?</p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      A IA atende quando:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Chat está em status "pendente"</li>
                      <li>• Nenhum FluxoBot ativo para o contato</li>
                      <li>• IA está habilitada para a empresa</li>
                      <li>• Instância está na lista permitida (ou todas)</li>
                      <li>• Chat foi encerrado e cliente enviou nova mensagem</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      A IA para quando:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Cliente pede atendente humano</li>
                      <li>• Atendente responde manualmente</li>
                      <li>• Cliente demonstra dificuldade (3+ mensagens confusas)</li>
                      <li>• IA é desabilitada nas configurações</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pb-6">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                >
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Configurações
                </Button>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
