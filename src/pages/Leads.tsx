import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Filter, Edit, Trash, Phone, MessageCircle,
  MoreVertical, Users, Flame, Thermometer, Snowflake, TrendingUp,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LeadDetailDrawer } from "@/pages/LeadDetailDrawer";
import { useNavigate } from "react-router-dom";
import { leadService } from "@/services/lead.service";

// ─── Helpers ─────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome?.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() ?? "?";
}

function getAvatarColor(temp: number) {
  if (temp === 3) return { bg: "#fee2e2", text: "#b91c1c" };
  if (temp === 2) return { bg: "#fef9c3", text: "#92400e" };
  return { bg: "#dbeafe", text: "#1d4ed8" };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    novo:      { label: "Novo",      bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
    contato:   { label: "Em Contato",bg: "#fefce8", text: "#92400e", dot: "#f59e0b" },
    Visista:   { label: "Visitou",   bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
    Proposta:  { label: "Proposta",  bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
    desistiu:  { label: "Desistiu",  bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" },
  };
  const cfg = map[status] ?? { label: status ?? "—", bg: "#f8fafc", text: "#64748b", dot: "#94a3b8" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TempBadge({ temp }: { temp: number }) {
  const cfg =
    temp === 3 ? { label: "Quente", icon: Flame,       bg: "#fef2f2", text: "#b91c1c", ic: "#ef4444" } :
    temp === 2 ? { label: "Morno",  icon: Thermometer, bg: "#fefce8", text: "#92400e", ic: "#f59e0b" } :
                 { label: "Frio",   icon: Snowflake,   bg: "#eff6ff", text: "#1d4ed8", ic: "#60a5fa" };
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <Icon className="w-3 h-3" style={{ color: cfg.ic }} />
      {cfg.label}
    </span>
  );
}

// ─── Card Mobile ─────────────────────────────────────────────────

function LeadCard({ lead, onOpen, onEdit, onDelete }: {
  lead: any; onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const avatar = getAvatarColor(lead.temperatura);
  const borderColor = lead.temperatura === 3 ? "#f87171" : lead.temperatura === 2 ? "#fbbf24" : "#93c5fd";

  return (
    <div
      className="relative rounded-2xl border bg-card shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
      onClick={onOpen}
    >
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: avatar.bg, color: avatar.text }}
            >
              {getInitials(lead.name ?? lead.nome)}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{lead.name ?? lead.nome}</p>
              {lead.telefone && <p className="text-xs text-muted-foreground mt-0.5">{lead.telefone}</p>}
            </div>
          </div>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-background border rounded-xl shadow-lg py-1 w-36">
                  <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted"
                    onClick={() => { setMenuOpen(false); onEdit(); }}>
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />Editar
                  </button>
                  <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => { setMenuOpen(false); onDelete(); }}>
                    <Trash className="w-3.5 h-3.5" />Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {lead.interesse && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {lead.interesse}
            </span>
          )}
          <StatusBadge status={lead.status} />
          <TempBadge temp={lead.temperatura} />
        </div>
        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted hover:bg-muted/70 text-xs font-medium"
            onClick={() => window.open(`tel:${lead.telefone}`)}
          >
            <Phone className="w-3.5 h-3.5 text-primary" />Ligar
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border"
            style={{ background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}
            onClick={() => window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, "")}`)}
          >
            <MessageCircle className="w-3.5 h-3.5" />WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────

const Leads = () => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState("novo");
  const [interesse, setInteresse] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading: loading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadService.getAll(),
    staleTime: 1000 * 60 * 5,
  });

  function carregarLeads() { queryClient.invalidateQueries({ queryKey: ["leads"] }); }
  function limparCampos() {
    setNome(""); setEmail(""); setTelefone(""); setStatus("novo");
    setInteresse(""); setObservacoes(""); setTemperatura(""); setResponsavel("");
  }

  async function handleCreate() {
    if (!nome) { alert("Nome é obrigatório."); return; }
    try {
      await leadService.create({ nome, telefone, email, status, interesse, temperatura, gestor_responsavel: responsavel, observacoes });
      toast({ title: "Lead criado com sucesso 🎉" });
      setOpenCreate(false); limparCampos(); carregarLeads();
    } catch (error: any) {
      alert("Erro ao criar lead: " + (error?.response?.data?.message ?? error.message));
    }
  }

  function abrirModalEdit(lead: any) {
    setSelectedLead(lead);
    setNome(lead.name); setEmail(lead.email ?? ""); setTelefone(lead.telefone ?? "");
    setInteresse(lead.interesse ?? ""); setObservacoes(lead.observacoes ?? "");
    setStatus((lead.status ?? "").normalize("NFD").replace(/[̀-ͯ]/g, ""));
    setOpenEdit(true);
  }

  async function handleUpdate() {
    if (!selectedLead) return;
    try {
      await leadService.update(selectedLead.id, { nome, email, telefone, status, interesse, observacoes });
      toast({ title: "Lead atualizado ✅" });
      setOpenEdit(false); carregarLeads(); limparCampos();
    } catch (error: any) {
      alert("Erro ao atualizar lead: " + (error?.response?.data?.message ?? error.message));
    }
  }

  async function handleDelete() {
    if (!selectedLead) return;
    try {
      await leadService.delete(selectedLead.id);
      toast({ title: "Lead apagado" });
      setOpenDelete(false); carregarLeads();
    } catch {
      alert("Erro ao excluir lead.");
    }
  }

  const leadsFiltrados = leads.filter((l) =>
    l.name?.toLowerCase().includes(busca.toLowerCase()) ||
    l.interesse?.toLowerCase().includes(busca.toLowerCase())
  );
  const allSelected = leadsFiltrados.length > 0 && selectedIds.length === leadsFiltrados.length;
  function toggleAll(c: boolean) { setSelectedIds(c ? leadsFiltrados.map((l) => l.id) : []); }
  function toggleOne(id: string, c: boolean) { setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter((x) => x !== id)); }

  // KPIs
  const total   = leads.filter((l) => l.status !== "bolsao").length;
  const quentes = leads.filter((l) => l.temperatura === 3).length;
  const mornos  = leads.filter((l) => l.temperatura === 2).length;
  const novos   = leads.filter((l) => l.status === "novo").length;

  const kpis = [
    { label: "Total",   value: total,   icon: Users,       bg: "#eff6ff", text: "#1d4ed8", ic: "#3b82f6" },
    { label: "Novos",   value: novos,   icon: TrendingUp,  bg: "#f0fdf4", text: "#15803d", ic: "#22c55e" },
    { label: "Quentes", value: quentes, icon: Flame,       bg: "#fef2f2", text: "#b91c1c", ic: "#ef4444" },
    { label: "Mornos",  value: mornos,  icon: Thermometer, bg: "#fefce8", text: "#92400e", ic: "#f59e0b" },
  ];

  const modalInput = "w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar />

      <main className="ml-0 md:ml-16 flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 pb-24 md:pb-8 space-y-5">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Leads</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Gerencie seus leads e oportunidades de venda</p>
            </div>
            <Button
              className="gap-2 rounded-xl h-10 px-5 font-semibold shadow-sm"
              onClick={() => setOpenCreate(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lead</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>

          {/* ── KPI PILLS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map(({ label, value, icon: Icon, bg, text, ic }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3.5 rounded-2xl border"
                style={{ background: bg, borderColor: `${ic}30` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${ic}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: ic }} />
                </div>
                <div>
                  <p className="text-xl font-black leading-none" style={{ color: text }}>{value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: `${text}99` }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── BUSCA ── */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, interesse..."
                className="pl-10 rounded-xl h-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 rounded-xl h-10">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>

          {/* Selecionados */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-medium">
                <strong>{selectedIds.length}</strong> lead{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Limpar</Button>
            </div>
          )}

          {/* ── MOBILE: Cards ── */}
          <div className="md:hidden space-y-3">
            {loading && [1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
            {!loading && leadsFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">Nenhum lead encontrado</p>
                <p className="text-sm mt-1">Ajuste a busca ou crie um novo lead</p>
              </div>
            )}
            {!loading && leadsFiltrados.map((lead) => (
              <LeadCard
                key={lead.id} lead={lead}
                onOpen={() => { setSelectedLead(lead); setOpenDrawer(true); }}
                onEdit={() => abrirModalEdit(lead)}
                onDelete={() => { setSelectedLead(lead); setOpenDelete(true); }}
              />
            ))}
          </div>

          {/* ── DESKTOP: Tabela ── */}
          <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: "hsl(var(--muted)/0.4)" }}>
                  <th className="w-12 px-4 py-3">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interesse</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temperatura</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Carregando leads...
                    </div>
                  </td></tr>
                )}
                {!loading && leadsFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">Nenhum lead encontrado</p>
                    <p className="text-muted-foreground text-sm mt-1">Ajuste a busca ou crie um novo lead</p>
                  </td></tr>
                )}
                {!loading && leadsFiltrados.map((lead, idx) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const avatar = getAvatarColor(lead.temperatura);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); setOpenDrawer(true); }}
                      className={cn(
                        "border-b last:border-0 transition-colors cursor-pointer group",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td className="px-4 py-3.5 w-12" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={(c) => toggleOne(lead.id, c as boolean)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: avatar.bg, color: avatar.text }}
                          >
                            {getInitials(lead.name ?? lead.nome)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{lead.name ?? lead.nome}</p>
                            {lead.telefone && <p className="text-xs text-muted-foreground mt-0.5">{lead.telefone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {lead.interesse
                          ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{lead.interesse}</span>
                          : <span className="text-muted-foreground text-sm">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3.5"><TempBadge temp={lead.temperatura} /></td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Ligar"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-colors"
                            onClick={() => window.open(`tel:${lead.telefone}`)}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="WhatsApp"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-green-50 text-green-600 transition-colors"
                            onClick={() => window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, "")}`)}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Editar"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => abrirModalEdit(lead)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Excluir"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                            onClick={() => { setSelectedLead(lead); setOpenDelete(true); }}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && (
              <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {leadsFiltrados.length} lead{leadsFiltrados.length !== 1 ? "s" : ""} encontrado{leadsFiltrados.length !== 1 ? "s" : ""}
                </p>
                {selectedIds.length > 0 && (
                  <p className="text-xs text-primary font-medium">{selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}</p>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── MODAL CRIAR ── */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-2xl w-full sm:w-[440px] shadow-2xl border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Novo Lead</h2>
              <button onClick={() => { setOpenCreate(false); limparCampos(); }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <input className={modalInput} placeholder="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} />
              <input className={modalInput} placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              <input className={modalInput} placeholder="Gestor responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              <Select value={temperatura} onValueChange={setTemperatura}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Temperatura do Lead" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRIO❄️">❄️ Frio</SelectItem>
                  <SelectItem value="MORNO⛅">⛅ Morno</SelectItem>
                  <SelectItem value="QUENTE🔥">🔥 Quente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={interesse} onValueChange={setInteresse}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Interesse" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOTE🟤">Lote</SelectItem>
                  <SelectItem value="ALUGUEL🏚️">Aluguel</SelectItem>
                  <SelectItem value="FINANCIAMENTO💵">Financiamento</SelectItem>
                </SelectContent>
              </Select>
              <textarea
                placeholder="Observações..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full min-h-[90px] resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="rounded-xl" onClick={() => { setOpenCreate(false); limparCampos(); }}>Cancelar</Button>
              <Button className="rounded-xl px-6" onClick={handleCreate}>Salvar Lead</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ── */}
      {openEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-2xl w-full sm:w-[440px] shadow-2xl border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Editar Lead</h2>
              <button onClick={() => { setOpenEdit(false); limparCampos(); }} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <input className={modalInput} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              <input className={modalInput} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={modalInput} placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              <input className={modalInput} placeholder="Interesse" value={interesse} onChange={(e) => setInteresse(e.target.value)} />
              <textarea
                placeholder="Observações..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full min-h-[80px] resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="rounded-xl" onClick={() => { setOpenEdit(false); limparCampos(); }}>Cancelar</Button>
              <Button className="rounded-xl px-6" onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUIR ── */}
      {openDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-2xl w-full sm:w-[380px] shadow-2xl border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-1">
              <Trash className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-black">Excluir Lead</h2>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{selectedLead?.name ?? selectedLead?.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="rounded-xl" onClick={() => setOpenDelete(false)}>Cancelar</Button>
              <Button variant="destructive" className="rounded-xl" onClick={handleDelete}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      <LeadDetailDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        lead={selectedLead}
        onEdit={(lead) => { abrirModalEdit(lead); setOpenDrawer(false); }}
        onDelete={(lead) => { setSelectedLead(lead); setOpenDelete(true); setOpenDrawer(false); }}
        onFollowUp={(lead) => { navigate(`/dashboard/tarefas?lead=${lead.id}`); setOpenDrawer(false); }}
      />
    </div>
  );
};

export default Leads;
