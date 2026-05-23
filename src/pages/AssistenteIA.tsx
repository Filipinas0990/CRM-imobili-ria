import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.services";
import { toast } from "sonner";
import {
  Bot, CheckCircle2, AlertTriangle, Copy, Save,
  ChevronDown, ChevronUp, ArrowLeft, Loader2, Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length <= 2) return local;
  if (local.length <= 7) return `(${local.slice(0, 2)}) ${local.slice(2)}`;
  if (local.length <= 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return `(${local.slice(0, 2)}) ${local.slice(2, 3)} ${local.slice(3, 7)}-${local.slice(7, 11)}`;
}

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function toE164(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export default function AssistenteIA() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [phoneInput, setPhoneInput] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["assistente-config"],
    queryFn: authService.getAssistenteConfig,
  });

  useEffect(() => {
    if (config?.meu_phone) {
      setPhoneInput(formatPhoneDisplay(config.meu_phone));
    }
  }, [config?.meu_phone]);

  const mutation = useMutation({
    mutationFn: (phone: string) => authService.updateMe({ phone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assistente-config"] });
      toast.success("Número salvo com sucesso");
    },
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });

  function handleSave() {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Informe um número válido com DDD");
      return;
    }
    mutation.mutate(toE164(phoneInput));
  }

  function handleCopy() {
    if (!config?.filipe_phone) return;
    navigator.clipboard.writeText(config.filipe_phone);
    toast.success("Número copiado!");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/configuracoes")}
              className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight">Assistente IA Filipe</h1>
                <p className="text-xs text-muted-foreground">Cadastre leads e imóveis pelo WhatsApp</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="bg-card border border-border rounded-2xl p-5">
                {config?.configurado ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Assistente ativado</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Seu número está configurado. O Filipe já reconhece você.</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      Ativo
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Configure seu número para ativar</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Informe seu WhatsApp abaixo para o Filipe reconhecer você.</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      Pendente
                    </span>
                  </div>
                )}
              </div>

              {/* Número do Filipe */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Número do assistente Filipe
                  </Label>
                </div>

                {config?.filipe_phone ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 flex items-center px-3 bg-muted/40 rounded-xl border border-border text-sm text-foreground font-mono">
                      +{config.filipe_phone.replace(/^(\d{2})(\d{2})(\d{1})(\d{4})(\d{4})$/, "$1 ($2) $3 $4-$5")}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-11 px-4 gap-2 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/40 rounded-xl border border-border">
                    O assistente ainda está sendo configurado. Em breve disponível.
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Salve esse número na agenda do seu celular como "Filipe IA".
                </p>
              </div>

              {/* Meu número */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="meu-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Meu número de WhatsApp
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="meu-phone"
                    type="tel"
                    placeholder="(11) 9 9999-9999"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(applyPhoneMask(e.target.value))}
                    className="h-11 flex-1"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={mutation.isPending}
                    className="h-11 px-4 gap-2 shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {mutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />
                    }
                    Salvar
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Esse é o número que o Filipe usa para identificar quem é você nas mensagens.
                </p>
              </div>

              {/* Como usar */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowGuide((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📱</span>
                    <span className="text-sm font-semibold text-foreground">Como usar o assistente</span>
                  </div>
                  {showGuide
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </button>

                {showGuide && (
                  <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Salve o número do Filipe no seu celular e mande mensagem como se fosse
                      uma conversa normal. Exemplos:
                    </p>

                    {[
                      {
                        emoji: "➕",
                        title: "Cadastrar lead",
                        example: "Filipe, cadastra o João Silva, telefone 11 99999-8888, interessado em apartamento",
                      },
                      {
                        emoji: "💰",
                        title: "Registrar venda",
                        example: "Filipe, registra uma venda de R$ 350.000 do imóvel Residencial Park",
                      },
                      {
                        emoji: "🏠",
                        title: "Cadastrar imóvel",
                        example: "Filipe, cadastra um apartamento chamado Vista Livre em São Paulo por 280 mil",
                      },
                    ].map(({ emoji, title, example }) => (
                      <div key={title} className="bg-muted/40 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-semibold text-foreground">
                          {emoji} {title}
                        </p>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          "{example}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
