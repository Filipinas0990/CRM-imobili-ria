import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Filter, Edit, Trash, Phone, MessageCircle, MoreVertical,
} from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createLead } from "@/integrations/supabase/leads/createLead";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { updateLead } from "@/integrations/supabase/leads/updateLead";
import { deleteLead } from "@/integrations/supabase/leads/deleteLead";
import { toast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { LeadDetailDrawer } from "@/pages/LeadDetailDrawer";
import { useNavigate } from "react-router-dom";

// ─── Badges ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    novo: { label: "Novo", cls: "border-blue-400 text-blue-600 bg-blue-50" },
    contato: { label: "Em Contato", cls: "border-yellow-400 text-yellow-700 bg-yellow-50" },
    Visista: { label: "Visitou", cls: "border-orange-400 text-orange-600 bg-orange-50" },
    Proposta: { label: "Proposta", cls: "border-green-400 text-green-700 bg-green-50" },
    desistiu: { label: "Desistiu", cls: "border-red-400 text-red-600 bg-red-50" },
  };
  const cfg = map[status] ?? { label: status ?? "—", cls: "border-border text-muted-foreground bg-muted" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function TemperaturaBadge({ temp }: { temp: string }) {
  const t = temp?.toLowerCase() ?? "";
  let label = temp ?? "—";
  let cls = "border-border text-muted-foreground bg-muted";
  if (t.includes("quente")) { label = "QUENTE 🔥"; cls = "border-red-300 text-red-700 bg-red-50"; }
  else if (t.includes("morno")) { label = "MORNO ⛅"; cls = "border-yellow-300 text-yellow-700 bg-yellow-50"; }
  else if (t.includes("frio")) { label = "FRIO ❄️"; cls = "border-blue-300 text-blue-700 bg-blue-50"; }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", cls)}>
      {label}
    </span>
  );
}

function fundoLinha(temp: string) {
  const t = temp?.toLowerCase() ?? "";
  if (t.includes("quente")) return "bg-red-50";
  if (t.includes("morno")) return "bg-yellow-50/40";
  return "";
}

function getInitials(nome: string) {
  return nome?.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() ?? "?";
}

function getAvatarColor(temp: string) {
  const t = temp?.toLowerCase() ?? "";
  if (t.includes("quente")) return "bg-red-100 text-red-700";
  if (t.includes("morno")) return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

// ─── Card Mobile ─────────────────────────────────────────────────

function LeadCard({ lead, onOpen, onEdit, onDelete }: {
  lead: any;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card shadow-sm overflow-hidden transition-all active:scale-[0.98]",
        fundoLinha(lead.temperatura) || "bg-card"
      )}
      onClick={onOpen}
    >
      {/* Faixa colorida lateral */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
        lead.temperatura?.toLowerCase().includes("quente") ? "bg-red-400" :
          lead.temperatura?.toLowerCase().includes("morno") ? "bg-yellow-400" :
            "bg-blue-300"
      )} />

      <div className="pl-4 pr-3 py-4">
        {/* Header do card */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Avatar com iniciais */}
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
              getAvatarColor(lead.temperatura)
            )}>
              {getInitials(lead.nome)}
            </div>

            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">{lead.nome}</p>
              {lead.telefone && (
                <p className="text-xs text-muted-foreground mt-0.5">{lead.telefone}</p>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-background border rounded-xl shadow-lg py-1 w-36">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                  >
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    Editar
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                  >
                    <Trash className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {lead.interesse && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50">
              {lead.interesse}
            </span>
          )}
          <StatusBadge status={lead.status} />
          <TemperaturaBadge temp={lead.temperatura} />
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-xs font-medium text-foreground"
            onClick={() => window.open(`tel:${lead.telefone}`)}
          >
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            Ligar
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-xs font-medium text-green-700 border border-green-200"
            onClick={() => window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, "")}`)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
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
  const [origem, setOrigem] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const navigate = useNavigate();

  // ✅ React Query — cache automático de 5 minutos
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading: loading } = useQuery({
    queryKey: ["leads"],
    queryFn: getLeads,
    staleTime: 1000 * 60 * 5,
  });

  function carregarLeads() {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }

  function limparCampos() {
    setNome(""); setEmail(""); setTelefone(""); setStatus("novo");
    setInteresse(""); setObservacoes(""); setTemperatura(""); setOrigem(""); setResponsavel("");
  }

  async function handleCreate() {
    if (!nome) { alert("Nome é obrigatório."); return; }
    const r = await createLead({ nome, email, telefone, status, interesse, origem, temperatura, observacoes });
    if (r?.error) { alert("Erro ao criar lead: " + r.error); return; }
    toast({ title: "Lead criado com sucesso 🎉", description: "O lead foi cadastrado e já está disponível no sistema." });
    setOpenCreate(false);
    limparCampos();
    carregarLeads();
  }

  function abrirModalEdit(lead: any) {
    setSelectedLead(lead);
    setNome(lead.nome);
    setEmail(lead.email ?? "");
    setTelefone(lead.telefone ?? "");
    setInteresse(lead.interesse ?? "");
    setObservacoes(lead.observacoes ?? "");
    const normalized = (lead.status ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    setStatus(normalized);
    setOpenEdit(true);
  }

  async function handleUpdate() {
    if (!selectedLead) return;
    const r = await updateLead(selectedLead.id, { nome, email, telefone, status, interesse, observacoes });
    if (r?.error) { alert("Erro ao atualizar lead: " + r.error); return; }
    toast({ title: "Lead atualizado ✅" });
    setOpenEdit(false);
    carregarLeads();
    limparCampos();
  }

  async function handleDelete() {
    if (!selectedLead) return;
    const r = await deleteLead(selectedLead.id);
    if (r?.error) { alert("Erro ao excluir lead."); return; }
    toast({ title: "Lead apagado 😭", description: "O lead foi removido do sistema." });
    setOpenDelete(false);
    carregarLeads();
  }

  const leadsFiltrados = leads.filter((l) =>
    l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    l.interesse?.toLowerCase().includes(busca.toLowerCase())
  );
  const allSelected = leadsFiltrados.length > 0 && selectedIds.length === leadsFiltrados.length;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? leadsFiltrados.map((l) => l.id) : []);
  }
  function toggleOne(id: string, checked: boolean) {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar />

      <main className="ml-0 md:ml-16 flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 pb-24 md:pb-8 space-y-4 md:space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground mt-1 text-sm">Gerencie seus leads e oportunidades de venda</p>
            </div>
            <Button className="gap-2 rounded-xl" onClick={() => setOpenCreate(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lead</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>

          {/* Busca */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, interesse..."
                className="pl-10 rounded-xl"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>

          {/* Selecionados */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm text-foreground">
                <strong>{selectedIds.length}</strong> lead{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                Limpar seleção
              </Button>
            </div>
          )}

          {/* ── MOBILE: Cards ── */}
          <div className="md:hidden space-y-3">
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!loading && leadsFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">Nenhum lead encontrado</p>
                <p className="text-sm mt-1">Tente ajustar a busca ou crie um novo lead</p>
              </div>
            )}

            {!loading && leadsFiltrados.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpen={() => { setSelectedLead(lead); setOpenDrawer(true); }}
                onEdit={() => abrirModalEdit(lead)}
                onDelete={() => { setSelectedLead(lead); setOpenDelete(true); }}
              />
            ))}
          </div>

          {/* ── DESKTOP: Tabela ── */}
          <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-12 p-3">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Lead</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Interesse</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Temperatura</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground animate-pulse">Carregando leads...</td>
                    </tr>
                  )}
                  {!loading && leadsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum lead encontrado.</td>
                    </tr>
                  )}
                  {!loading && leadsFiltrados.map((lead, index) => {
                    const isSelected = selectedIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => { setSelectedLead(lead); setOpenDrawer(true); }}
                        className={cn(
                          "border-b last:border-0 transition-colors cursor-pointer",
                          fundoLinha(lead.temperatura),
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="p-6 w-12" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={(checked) => toggleOne(lead.id, checked as boolean)} />
                        </td>
                        <td className="p-6">
                          <p className="font-medium text-sm text-foreground">{lead.nome}</p>
                          {lead.telefone && <p className="text-xs text-muted-foreground">{lead.telefone}</p>}
                        </td>
                        <td className="p-6"><p className="text-sm">{lead.interesse || "—"}</p></td>
                        <td className="p-6"><StatusBadge status={lead.status} /></td>
                        <td className="p-6"><TemperaturaBadge temp={lead.temperatura} /></td>
                        <td className="p-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`tel:${lead.telefone}`)}>
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, "")}`)}>
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirModalEdit(lead)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setSelectedLead(lead); setOpenDelete(true); }}>
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && (
            <p className="text-xs text-muted-foreground text-right">
              {leadsFiltrados.length} lead{leadsFiltrados.length !== 1 ? "s" : ""} encontrado{leadsFiltrados.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </main>

      {/* Modal Criar */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-2xl w-full sm:w-[420px] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold">Novo Lead</h2>
            <Input placeholder="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="rounded-xl" />
            <Input placeholder="Gestor responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="rounded-xl" />
            <Select value={temperatura} onValueChange={setTemperatura}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Temperatura do Lead" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FRIO❄️">FRIO ❄️</SelectItem>
                <SelectItem value="MORNO⛅">MORNO ⛅</SelectItem>
                <SelectItem value="QUENTE🔥">QUENTE 🔥</SelectItem>
              </SelectContent>
            </Select>
            <Select value={interesse} onValueChange={setInteresse}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Interesse do Lead" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOTE🟤">LOTE 🟤</SelectItem>
                <SelectItem value="ALUGUEL🏚️">ALUGUEL 🏚️</SelectItem>
                <SelectItem value="FINANCIAMENTO💵">FINANCIAMENTO 💵</SelectItem>
              </SelectContent>
            </Select>
            <textarea
              placeholder="Observações sobre o lead..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full min-h-[100px] resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setOpenCreate(false); limparCampos(); }}>Cancelar</Button>
              <Button className="rounded-xl" onClick={handleCreate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {openEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-2xl w-full sm:w-[420px] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold">Editar Lead</h2>
            <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="rounded-xl" />
            <Input placeholder="Interesse" value={interesse} onChange={(e) => setInteresse(e.target.value)} className="rounded-xl" />
            <textarea
              placeholder="Observações..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full min-h-[80px] resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setOpenEdit(false); limparCampos(); }}>Cancelar</Button>
              <Button className="rounded-xl" onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {openDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-2xl w-full sm:w-[360px] space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{selectedLead?.nome}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-2">
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