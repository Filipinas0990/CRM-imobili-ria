import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
  Plus, Search, CheckCircle2, CalendarCheck, Clock, AlertTriangle,
  Phone, MessageCircle, Mail, MapPin, Users, Loader2, X, Send,
  RefreshCw, Pencil, Trash2, MoreVertical, Zap, Bot, Sparkles,
  CalendarClock, Activity, Flame, Thermometer, Snowflake, Navigation,
  Power, AlertCircle, RotateCcw
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { leadService } from "@/services/lead.service";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const MICROSERVICO_URL = import.meta.env.VITE_MICROSERVICO_URL;
const MICROSERVICO_KEY = import.meta.env.VITE_MICROSERVICO_API_KEY;

// ── Types ──────────────────────────────────────────────────────────────────
type FollowupTipo = "ligacao" | "whatsapp" | "email" | "visita" | "reuniao";
type FollowupStatus = "pendente" | "atrasado" | "concluido" | "agendado";
type FollowupResultado = "interessado" | "sem_resposta" | "sem_interesse" | "agendou_visita" | "fechou_negocio";
type Temperatura = "quente" | "morno" | "frio";
type TabFilter = "todos" | FollowupStatus;

interface Followup {
  id: string;
  lead_id: string | null;
  lead_nome: string;
  lead_telefone: string;
  tipo: FollowupTipo;
  data_hora: string;
  observacao: string | null;
  status: FollowupStatus;
  notificar_whatsapp: boolean;
  resultado: FollowupResultado | null;
  data_conclusao: string | null;
  created_at: string;
  ai_generated?: boolean;
  ai_flag?: "enviar" | "aguardar" | null;
  ai_message?: string | null;
  user_id?: string;
}

interface IACard {
  id: string;
  telefone: string;
  nome: string;
  sequenciaAtual: number;
  ultimoEnvio: string | null;
  followUpFinalizado: boolean;
  iaAtiva: boolean;
  temperatura: Temperatura;
  ultimaMensagemEnviada: string | null;
  ultimoEnvioSucesso: boolean | null;
  erroUltimoEnvio: string | null;
  totalMensagens: number;
  clienteRespondeu: boolean;
}

interface IAFollowupsResponse {
  total: number;
  quentes: number;
  mornos: number;
  frios: number;
  cards: IACard[];
}

interface Lead { id: string; nome: string; telefone: string; }

// ── Constants ──────────────────────────────────────────────────────────────
const TIPO_LABELS: Record<FollowupTipo, string> = {
  ligacao: "Ligação", whatsapp: "WhatsApp", email: "E-mail",
  visita: "Visita", reuniao: "Reunião",
};
const RESULTADO_LABELS: Record<FollowupResultado, string> = {
  interessado: "Interessado", sem_resposta: "Sem resposta",
  sem_interesse: "Não tem interesse", agendou_visita: "Agendou visita",
  fechou_negocio: "Fechou negócio",
};
const TIPO_ICONS: Record<FollowupTipo, React.ReactNode> = {
  ligacao: <Phone className="w-3.5 h-3.5" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  visita: <MapPin className="w-3.5 h-3.5" />,
  reuniao: <Users className="w-3.5 h-3.5" />,
};
const TIPO_COLORS: Record<FollowupTipo, string> = {
  ligacao: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  whatsapp: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  email: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  visita: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  reuniao: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
};
const STATUS_BORDER: Record<FollowupStatus, string> = {
  atrasado: "border-l-red-500",
  pendente: "border-l-yellow-400",
  concluido: "border-l-emerald-500",
  agendado: "border-l-blue-500",
};
const STATUS_DATE_COLOR: Record<FollowupStatus, string> = {
  atrasado: "text-red-500 dark:text-red-400",
  pendente: "text-yellow-600 dark:text-yellow-400",
  concluido: "text-emerald-600 dark:text-emerald-400",
  agendado: "text-blue-500 dark:text-blue-400",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDataHora(iso: string): string {
  const date = parseISO(iso);
  const hora = format(date, "HH'h'mm", { locale: ptBR });
  if (isToday(date)) return `Hoje às ${hora}`;
  if (isTomorrow(date)) return `Amanhã às ${hora}`;
  return format(date, "dd/MM às HH'h'mm", { locale: ptBR });
}
function resolveStatus(f: Followup): FollowupStatus {
  if (f.status === "concluido") return "concluido";
  if (isPast(parseISO(f.data_hora))) return "atrasado";
  if (isToday(parseISO(f.data_hora))) return "pendente";
  return "agendado";
}

const avatarColors = ["#4F86F7", "#7C5CBF", "#E05FA0", "#F4874B", "#2BBFA4", "#5B6FD6", "#E05555", "#29B8D4", "#3DBD7D", "#F0B429"];
function getAvatarColor(str: string) {
  const sum = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
}
function getInitials(name: string) {
  const clean = name.replace(/^\+?\d[\d\s\-().]+$/, "").trim();
  if (!clean) return name.replace(/\D/g, "").slice(-2);
  return clean.trim().split(" ").slice(0, 2).map(n => n[0] ?? "").join("").toUpperCase();
}
function formatTelefone(tel: string) {
  const d = tel.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `+${tel}`;
}

// ── Temperatura Badge ──────────────────────────────────────────────────────
function TempBadge({ temp }: { temp: Temperatura }) {
  if (temp === "quente") return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">
      <Flame className="w-3 h-3" /> Quente
    </span>
  );
  if (temp === "morno") return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400">
      <Thermometer className="w-3 h-3" /> Morno
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400">
      <Snowflake className="w-3 h-3" /> Frio
    </span>
  );
}

// ── Card IA do Microserviço ────────────────────────────────────────────────
function IACardComponent({ card, onReenviar }: { card: IACard; onReenviar: (id: string) => Promise<void> }) {
  const [reenviando, setReenviando] = useState(false);
  const temErro = card.ultimoEnvioSucesso === false;

  async function handleReenviar() {
    setReenviando(true);
    await onReenviar(card.id);
    setReenviando(false);
  }

  return (
    <div className={`bg-white dark:bg-[#1a1d27] rounded-2xl border flex flex-col gap-3 p-4 shadow-sm hover:shadow-md transition-shadow ${temErro
      ? "border-red-200 dark:border-red-800/40"
      : "border-gray-200 dark:border-[#2a2f45]"
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: getAvatarColor(card.telefone) }}>
            {getInitials(card.nome)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
              {card.nome === card.telefone ? formatTelefone(card.telefone) : card.nome}
            </p>
            <p className="text-xs text-gray-400">{formatTelefone(card.telefone)}</p>
          </div>
        </div>
        <TempBadge temp={card.temperatura} />
      </div>

      {temErro ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Falha no envio</span>
          </div>
          <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed">
            {card.erroUltimoEnvio ?? "Erro desconhecido"}
          </p>
          {card.ultimaMensagemEnviada && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2 italic">
              "{card.ultimaMensagemEnviada}"
            </p>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-[#22263a] rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-violet-500 shrink-0" />
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              {card.clienteRespondeu ? "Cliente respondeu!" : "Mensagem enviada pela IA"}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
            {card.ultimaMensagemEnviada ?? "Aguardando próximo envio..."}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Seq. {card.sequenciaAtual}/15</span>
          {card.ultimoEnvio && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-xs text-gray-400">
                {format(new Date(card.ultimoEnvio), "dd/MM HH'h'mm")}
              </span>
            </>
          )}
          {card.followUpFinalizado && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-xs text-gray-400 font-medium">Finalizado</span>
            </>
          )}
        </div>
        {temErro && (
          <button
            onClick={handleReenviar}
            disabled={reenviando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
          >
            {reenviando ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Reenviar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Modal Novo / Editar ────────────────────────────────────────────────────
interface ModalNovoProps {
  onClose: () => void; onSaved: () => void;
  userId: string; editing?: Followup | null;
}
function ModalNovo({ onClose, onSaved, userId, editing }: ModalNovoProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState(editing?.lead_nome ?? "");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    editing ? { id: editing.lead_id ?? "", nome: editing.lead_nome, telefone: editing.lead_telefone } : null
  );
  const [showDrop, setShowDrop] = useState(false);
  const [tipo, setTipo] = useState<FollowupTipo>(editing?.tipo ?? "whatsapp");
  const [data, setData] = useState(editing ? editing.data_hora.slice(0, 10) : "");
  const [hora, setHora] = useState(editing ? editing.data_hora.slice(11, 16) : "");
  const [observacao, setObservacao] = useState(editing?.observacao ?? "");
  const [notificar, setNotificar] = useState(editing?.notificar_whatsapp ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    leadService.getAll()
      .then(data => setLeads(data.map(l => ({ id: l.id, nome: l.name, telefone: l.telefone }))))
      .catch(() => setLeads([]));
  }, []);

  const filteredLeads = leads.filter(l =>
    l.nome?.toLowerCase().includes(leadSearch.toLowerCase()) || l.telefone?.includes(leadSearch)
  );

  async function handleSave() {
    if (!selectedLead || !data || !hora) return;
    setSaving(true);
    const payload = {
      user_id: userId, lead_id: selectedLead.id || null,
      lead_nome: selectedLead.nome, lead_telefone: selectedLead.telefone,
      tipo, data_hora: `${data}T${hora}:00`,
      observacao: observacao || null, notificar_whatsapp: notificar,
      status: "agendado" as FollowupStatus,
    };
    // TODO: implementar endpoint do microserviço
    console.log("[followup] save:", payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-[#2a2f45]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {editing ? "Editar Follow-up" : "Novo Follow-up"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Lead</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={leadSearch}
                onChange={e => { setLeadSearch(e.target.value); setShowDrop(true); setSelectedLead(null); }}
                onFocus={() => setShowDrop(true)} placeholder="Buscar lead..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors" />
            </div>
            {showDrop && filteredLeads.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredLeads.slice(0, 8).map(l => (
                  <button key={l.id} onClick={() => { setSelectedLead(l); setLeadSearch(l.nome); setShowDrop(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: getAvatarColor(l.id) }}>{getInitials(l.nome)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{l.nome}</p>
                      <p className="text-xs text-gray-400">{l.telefone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TIPO_LABELS) as FollowupTipo[]).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tipo === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 dark:border-[#2a2f45] text-gray-500 dark:text-gray-400 hover:border-blue-300"}`}>
                  {TIPO_ICONS[t]} {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-300 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-300 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Observação</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2}
              placeholder="Detalhes do follow-up..."
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 resize-none transition-colors" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#22263a] rounded-xl border border-gray-200 dark:border-[#2a2f45]">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Envio automático via WhatsApp</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Mensagem enviada automaticamente no horário</p>
            </div>
            <div onClick={() => setNotificar(p => !p)} className="cursor-pointer">
              <div className={`w-11 h-6 rounded-full transition-colors relative ${notificar ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notificar ? "translate-x-6" : "translate-x-1"}`} />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !selectedLead || !data || !hora}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : editing ? "Salvar alterações" : "Agendar Follow-up"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Concluir ─────────────────────────────────────────────────────────
interface ModalConcluirProps { followup: Followup; onClose: () => void; onSaved: () => void; }
function ModalConcluir({ followup, onClose, onSaved }: ModalConcluirProps) {
  const [resultado, setResultado] = useState<FollowupResultado>("interessado");
  const [observacao, setObservacao] = useState("");
  const [criarProximo, setCriarProximo] = useState(false);
  const [proximaData, setProximaData] = useState("");
  const [proximaHora, setProximaHora] = useState("");
  const [proximoTipo, setProximoTipo] = useState<FollowupTipo>("whatsapp");
  const [saving, setSaving] = useState(false);

  async function handleConcluir() {
    setSaving(true);
    // TODO: POST ${MICROSERVICO_URL}/followups/${followup.id}/concluir
    console.log("[followup] concluir:", followup.id, resultado, observacao);
    if (criarProximo && proximaData && proximaHora) {
      // TODO: POST ${MICROSERVICO_URL}/followups para criar próximo
      console.log("[followup] criar próximo:", proximoTipo, proximaData, proximaHora);
    }
    setSaving(false); onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-[#2a2f45]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2f45]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Concluir Follow-up</h2>
              <p className="text-xs text-gray-400 mt-0.5">{followup.lead_nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Resultado</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(RESULTADO_LABELS) as FollowupResultado[]).map(r => (
                <button key={r} onClick={() => setResultado(r)}
                  className={`text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${resultado === r ? "bg-blue-600 text-white border-blue-600 font-medium" : "border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-400 hover:border-blue-300"}`}>
                  {RESULTADO_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Observação</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2}
              placeholder={followup.notificar_whatsapp ? "Essa mensagem será enviada via WhatsApp..." : "Anotações sobre o contato..."}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 resize-none transition-colors" />
          </div>
          <div className="border border-gray-100 dark:border-[#2a2f45] rounded-xl overflow-hidden">
            <label className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agendar próximo follow-up</span>
              <div onClick={() => setCriarProximo(p => !p)} className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${criarProximo ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${criarProximo ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
            {criarProximo && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-[#2a2f45] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(TIPO_LABELS) as FollowupTipo[]).map(t => (
                    <button key={t} onClick={() => setProximoTipo(t)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${proximoTipo === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 dark:border-[#2a2f45] text-gray-500 dark:text-gray-400"}`}>
                      {TIPO_ICONS[t]} {TIPO_LABELS[t]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={proximaData} onChange={e => setProximaData(e.target.value)} className="px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-300 transition-colors" />
                  <input type="time" value={proximaHora} onChange={e => setProximaHora(e.target.value)} className="px-3 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-300 transition-colors" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2f45] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-[#2a2f45] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-colors">Cancelar</button>
          <button onClick={handleConcluir} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><CheckCircle2 className="w-4 h-4" /> Concluir</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
const FollowUps = () => {
  const userId = useAuthStore(s => s.user?.id ?? "");
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [iaData, setIaData] = useState<IAFollowupsResponse | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("todos");
  const [showModalNovo, setShowModalNovo] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);
  const [concluindoFollowup, setConcluindoFollowup] = useState<Followup | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [iaEnabled, setIaEnabled] = useState(true);
  const [togglingIA, setTogglingIA] = useState(false);

  const fetchIAFollowups = useCallback(async (instancia: string) => {
    if (!instancia || !MICROSERVICO_URL || !MICROSERVICO_KEY) return;
    setLoadingIA(true);
    try {
      const res = await fetch(
        `${MICROSERVICO_URL}/ia-followups?instancia=${encodeURIComponent(instancia)}`,
        { headers: { 'x-api-key': MICROSERVICO_KEY } }
      );
      if (!res.ok) throw new Error('Erro ao buscar dados da IA');
      const data: IAFollowupsResponse = await res.json();
      setIaData(data);
    } catch (err) {
      console.error('Erro ao buscar ia-followups:', err);
    } finally {
      setLoadingIA(false);
    }
  }, []);

  async function handleReenviar(clienteId: string) {
    try {
      const res = await fetch(`${MICROSERVICO_URL}/ia-followups/reenviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': MICROSERVICO_KEY },
        body: JSON.stringify({ clienteId }),
      });
      const data = await res.json();
      if (data.sucesso && instanceName) await fetchIAFollowups(instanceName);
    } catch (err) {
      console.error('Erro ao reenviar:', err);
    }
  }

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: GET ${MICROSERVICO_URL}/followups quando endpoint estiver pronto
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    async function init() {
      const instancia = import.meta.env.VITE_EVOLUTION_INSTANCE ?? null;
      setInstanceName(instancia);
      await Promise.all([
        fetchFollowups(),
        instancia ? fetchIAFollowups(instancia) : Promise.resolve(),
      ]);
    }
    init();
  }, [userId, fetchFollowups, fetchIAFollowups]);

  async function handleToggleIA() {
    setTogglingIA(true);
    try {
      // TODO: persistir no microserviço
      setIaEnabled(p => !p);
    } finally {
      setTogglingIA(false);
    }
  }

  async function handleDelete(id: string) {
    // TODO: DELETE ${MICROSERVICO_URL}/followups/${id}
    setFollowups(prev => prev.filter(f => f.id !== id));
    setMenuOpenId(null);
  }

  const enriched: Followup[] = followups.map(f => ({ ...f, status: resolveStatus(f) }));
  const filtered = enriched
    .filter(f => activeTab === "todos" || f.status === activeTab)
    .filter(f => f.lead_nome.toLowerCase().includes(busca.toLowerCase()) || f.lead_telefone.includes(busca));

  const countBy = (tab: TabFilter) => tab === "todos" ? enriched.length : enriched.filter(f => f.status === tab).length;

  const quentes = iaData?.quentes ?? 0;
  const mornos = iaData?.mornos ?? 0;
  const frios = iaData?.frios ?? 0;
  const erros = iaData?.cards.filter(c => c.ultimoEnvioSucesso === false).length ?? 0;

  const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
    { key: "todos", label: "Todos", icon: <CalendarClock className="w-3.5 h-3.5" /> },
    { key: "pendente", label: "Pendentes", icon: <Clock className="w-3.5 h-3.5" /> },
    { key: "atrasado", label: "Atrasados", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { key: "concluido", label: "Concluídos", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { key: "agendado", label: "Agendados", icon: <CalendarCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-screen flex bg-[#f5f6fa] dark:bg-[#0f1117] overflow-hidden transition-colors duration-200">
      <Sidebar />

      {(showModalNovo || editingFollowup) && (
        <ModalNovo onClose={() => { setShowModalNovo(false); setEditingFollowup(null); }}
          onSaved={fetchFollowups} userId={userId} editing={editingFollowup} />
      )}
      {concluindoFollowup && (
        <ModalConcluir followup={concluindoFollowup}
          onClose={() => setConcluindoFollowup(null)} onSaved={fetchFollowups} />
      )}

      <div className="ml-16 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white dark:bg-[#1a1d27] border-b border-gray-200 dark:border-[#2a2f45] flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Follow-up</h1>
              <p className="text-xs text-gray-400">Acompanhamento automático com análise de I.A.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => instanceName && fetchIAFollowups(instanceName)}
              disabled={loadingIA}
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] hover:bg-gray-200 dark:hover:bg-[#2a2f45] flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingIA ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleToggleIA}
              disabled={togglingIA}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-medium transition-colors ${iaEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 hover:bg-gray-500"}`}
            >
              {togglingIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Power className="w-4 h-4" />{iaEnabled ? "IA Ativa" : "IA Inativa"}</>}
            </button>
            <button onClick={() => setShowModalNovo(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Novo Follow-up
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">

          {/* Stats bar */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#22263a] flex items-center justify-center">
                <Activity className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{iaEnabled ? "Ativo" : "Inativo"}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Quentes</p>
                <p className="text-sm font-bold text-red-500">{quentes}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Mornos</p>
                <p className="text-sm font-bold text-amber-500">{mornos}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Snowflake className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Frios</p>
                <p className="text-sm font-bold text-blue-400">{frios}</p>
              </div>
            </div>
            <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${erros > 0 ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40" : "bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2a2f45]"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${erros > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-[#22263a]"}`}>
                <AlertCircle className={`w-4 h-4 ${erros > 0 ? "text-red-500" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Erros</p>
                <p className={`text-sm font-bold ${erros > 0 ? "text-red-500" : "text-gray-400"}`}>{erros}</p>
              </div>
            </div>
          </div>

          {/* Cards da IA */}
          {iaEnabled && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cards de Follow-up (I.A.)</span>
                {iaData && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                    {iaData.total} card{iaData.total !== 1 ? "s" : ""}
                  </span>
                )}
                {erros > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">
                    {erros} erro{erros !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {loadingIA ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
              ) : iaData && iaData.cards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {iaData.cards.map(card => (
                    <IACardComponent key={card.id} card={card} onReenviar={handleReenviar} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col items-center justify-center py-10 gap-2">
                  <Bot className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400">Nenhum cliente em follow-up automático ainda</p>
                </div>
              )}
            </div>
          )}

          {/* Follow-ups manuais */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] shadow-sm">
            <div className="flex items-center gap-0.5 px-4 pt-3 border-b border-gray-100 dark:border-[#2a2f45] overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {tabs.map(({ key, label, icon }) => {
                const count = countBy(key);
                const isActive = activeTab === key;
                const isAtrasado = key === "atrasado" && count > 0;
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-all relative whitespace-nowrap ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                    {icon} {label}
                    {count > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${isAtrasado ? "bg-red-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-[#2a2f45] text-gray-500 dark:text-gray-400"}`}>
                        {count}
                      </span>
                    )}
                    {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2a2f45] rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-gray-300 dark:text-gray-600 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] flex flex-col items-center justify-center py-16 gap-3">
                <CalendarClock className="w-10 h-10 text-gray-200 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum follow-up encontrado</p>
                <button onClick={() => setShowModalNovo(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Agendar agora
                </button>
              </div>
            ) : (
              filtered.map(f => {
                const isConcluido = f.status === "concluido";
                return (
                  <div key={f.id} className={`bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-[#2a2f45] border-l-4 ${STATUS_BORDER[f.status]} shadow-sm px-6 py-4 flex items-center gap-5 transition-all hover:shadow-md`}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 select-none" style={{ backgroundColor: getAvatarColor(f.lead_nome) }}>
                      {getInitials(f.lead_nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold text-sm ${isConcluido ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>{f.lead_nome}</p>
                        <span className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${TIPO_COLORS[f.tipo]}`}>{TIPO_ICONS[f.tipo]} {TIPO_LABELS[f.tipo]}</span>
                        {f.notificar_whatsapp && !isConcluido && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium border border-green-200 dark:border-green-800/30">
                            <Zap className="w-3 h-3" /> Auto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-semibold ${STATUS_DATE_COLOR[f.status]}`}>{formatDataHora(f.data_hora)}</span>
                        {f.observacao && <><span className="text-gray-300 dark:text-gray-600 text-xs">·</span><span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-sm">{f.observacao}</span></>}
                      </div>
                      {f.resultado && (
                        <div className="mt-1.5">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">✓ {RESULTADO_LABELS[f.resultado]}</span>
                        </div>
                      )}
                    </div>
                    {!isConcluido && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setConcluindoFollowup(f)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                        </button>
                        <button onClick={() => setEditingFollowup(f)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2a2f45] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#22263a] text-xs font-medium transition-colors">
                          <CalendarCheck className="w-3.5 h-3.5" /> Reagendar
                        </button>
                      </div>
                    )}
                    <div className="relative shrink-0">
                      <button onClick={() => setMenuOpenId(menuOpenId === f.id ? null : f.id)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === f.id && (
                        <div className="absolute right-0 top-9 z-20 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2a2f45] rounded-xl shadow-xl py-1 min-w-[140px]">
                          <button onClick={() => { setEditingFollowup(f); setMenuOpenId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#22263a] flex items-center gap-2 transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button onClick={() => handleDelete(f.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUps;
