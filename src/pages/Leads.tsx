import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Filter, Edit, Trash, Phone, MessageCircle, Calendar, MoreVertical,
} from "lucide-react";

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
  const [leads, setLeads] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  async function carregarLeads() {
    setLoading(true);
    const data = await getLeads();
    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => { carregarLeads(); }, []);

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
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? leadsFiltrados.map((l) => l.id) : []);
  }
  function toggleOne(id: string, checked: boolean) {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar />

      <main className="ml-16 flex-1 overflow-y-auto">
        <div className="p-8 space-y-5">


          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground mt-1">Gerencie seus leads e oportunidades de venda</p>
            </div>
            <Button className="gap-2" onClick={() => setOpenCreate(true)}>
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>


          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, interesse..."
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>


          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-sm text-foreground">
                <strong>{selectedIds.length}</strong> lead{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                Limpar seleção
              </Button>
            </div>
          )}


          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-12 p-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Selecionar todos"
                      />
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
                      <td colSpan={6} className="p-8 text-center text-muted-foreground animate-pulse">
                        Carregando leads...
                      </td>
                    </tr>
                  )}

                  {!loading && leadsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum lead encontrado.
                      </td>
                    </tr>
                  )}

                  {!loading && leadsFiltrados.map((lead, index) => {
                    const isSelected = selectedIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setOpenDrawer(true);
                        }}
                        className={cn(
                          "border-b last:border-0 transition-colors cursor-pointer",
                          fundoLinha(lead.temperatura),
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {/* Checkbox */}
                        <td className="p-6 w-12" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleOne(lead.id, checked as boolean)}
                            aria-label={`Selecionar ${lead.nome}`}
                          />
                        </td>

                        {/* Nome + telefone */}
                        <td className="p-6">
                          <p className="font-medium text-sm text-foreground leading-snug">{lead.nome}</p>
                          {lead.telefone && (
                            <p className="text-xs text-muted-foreground leading-snug">{lead.telefone}</p>
                          )}
                        </td>

                        {/* Interesse */}
                        <td className="p-6">
                          <p className="text-sm text-foreground">{lead.interesse || "—"}</p>
                        </td>

                        {/* Status */}
                        <td className="p-6">
                          <StatusBadge status={lead.status} />
                        </td>

                        {/* Temperatura */}
                        <td className="p-6">
                          <TemperaturaBadge temp={lead.temperatura} />
                        </td>

                        {/* Ações */}
                        <td className="p-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Ligar"
                              onClick={() => window.open(`tel:${lead.telefone}`)}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="WhatsApp"
                              onClick={() => window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, "")}`)}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Editar"
                              onClick={() => abrirModalEdit(lead)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Excluir"
                              onClick={() => { setSelectedLead(lead); setOpenDelete(true); }}
                            >
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


      {openCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-[420px] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold">Novo Lead</h2>
            <Input placeholder="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <Input placeholder="Gestor responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            <Select value={temperatura} onValueChange={setTemperatura}>
              <SelectTrigger><SelectValue placeholder="Temperatura do Lead" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FRIO❄️">FRIO ❄️</SelectItem>
                <SelectItem value="MORNO⛅">MORNO ⛅</SelectItem>
                <SelectItem value="QUENTE🔥">QUENTE 🔥</SelectItem>
              </SelectContent>
            </Select>
            <Select value={interesse} onValueChange={setInteresse}>
              <SelectTrigger><SelectValue placeholder="Interesse do Lead" /></SelectTrigger>
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
              className="w-full min-h-[100px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setOpenCreate(false); limparCampos(); }}>Cancelar</Button>
              <Button onClick={handleCreate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}


      {openEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-[420px] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold">Editar Lead</h2>
            <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <Input placeholder="Interesse" value={interesse} onChange={(e) => setInteresse(e.target.value)} />
            <textarea
              placeholder="Observações..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full min-h-[80px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setOpenEdit(false); limparCampos(); }}>Cancelar</Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}


      {openDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-[360px] space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{selectedLead?.nome}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
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