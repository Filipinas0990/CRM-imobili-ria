import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Edit, Trash } from "lucide-react";

// --- LEADS CRUD ---
import { createLead } from "@/integrations/supabase/leads/createLead";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { updateLead } from "@/integrations/supabase/leads/updateLead";
import { deleteLead } from "@/integrations/supabase/leads/deleteLead";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



const Leads = () => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState("novo");
  const [interesse, setInteresse] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const temperaturaLabel: Record<string, string> = {
    frio: "FRIO ❄️",
    morno: "MORNO ⛅",
    quente: "QUENTE 🔥",
  };


  const [origem, setOrigem] = useState("");
  const [responsavel, setResponsavel] = useState("");




  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [leadId, setLeadId] = useState<string>("");




  async function carregarLeads() {
    setLoading(true);
    const data = await getLeads();
    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregarLeads();
  }, []);

  function limparCampos() {
    setNome("");
    setEmail("");
    setTelefone("");
    setStatus("novo");
    setInteresse("");
  }
  async function handleCreate() {
    if (!nome) {
      alert("Nome é obrigatório.");
      return;
    }


    const r = await createLead({
      nome,
      email,
      telefone,
      status,
      interesse,
      origem,
      temperatura,

    });


    if (r?.error) {
      alert("Erro ao criar lead: " + r.error);
      return;
    }

    toast({
      title: "Lead criado com sucesso 🎉",
      description: "O lead foi cadastrado e já está disponível no sistema.",
    });

    setOpenCreate(false);
    limparCampos();
    carregarLeads();
  }
  function normalizarTemperatura(temp?: string) {
    if (!temp) return "";
    return temp
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");
  }

  // 
  // COR DA TEMPERATURA
  // 

  function corTemperatura(temp: string) {
    if (temp === "QUENTE🔥") return "bg-red-500 text-white";
    if (temp === "MORNO ⛅") return "bg-green-600 text-white";
    if (temp === "FRIO❄️") return "bg-blue-500 text-white";
    return "bg-muted";
  }

  // FUNDO DO CARD TEMPERATURA 

  function fundoTemperatura(temp: string) {
    if (temp === "QUENTE🔥") return "bg-red-500/5";
    if (temp === "MORNO ⛅") return "bg-green-600/5";

    return "bg-background";
  }


  // ============================
  // ABRIR MODAL EDIT
  // ============================
  function abrirModalEdit(lead: any) {
    setSelectedLead(lead);
    setNome(lead.nome);
    setEmail(lead.email);
    setTelefone(lead.telefone || "");
    setInteresse(lead.interesse || "");

    const normalized = lead.status
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    setStatus(normalized);
    setOpenEdit(true);
  }

  // ============================
  // UPDATE
  // ============================
  async function handleUpdate() {
    if (!selectedLead) return;

    const r = await updateLead(selectedLead.id, {
      nome,
      email,
      telefone,
      status,
      interesse,

    });

    if (r?.error) {
      alert("Erro ao atualizar lead: " + r.error);
      return;
    }

    alert("Lead atualizado!");
    setOpenEdit(false);
    carregarLeads();
    limparCampos();
  }

  // ============================
  // DELETE
  // ============================
  async function handleDelete() {
    if (!selectedLead) return;

    const r = await deleteLead(selectedLead.id);
    if (r?.error) {

      alert("Erro ao excluir lead.");
      return;
    }

    toast({
      title: "Lead Apagado 😭😭",
      description: "O lead já foi removido do sistema.",
    });

    setOpenDelete(false);
    carregarLeads();
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* CONTEÚDO AJUSTADO À SIDEBAR */}
      <main className="ml-16 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie seus leads e oportunidades
              </p>
            </div>

            <Button className="gap-2" onClick={() => setOpenCreate(true)}>
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar..."
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
              </CardTitle>
            </CardHeader>

            <CardContent>
              {loading && (
                <div className="space-y-4 animate-pulse">
                  <div className="text-lg font-semibold text-center opacity-70">
                    Leads carregando...
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border bg-muted/30 h-20"
                    />
                  ))}
                </div>
              )}

              {!loading && (
                <div className="space-y-4">
                  {leads
                    .filter((l) =>
                      l.nome.toLowerCase().includes(busca.toLowerCase())
                    )
                    .map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-4 rounded-lg transition
    border-2
    ${fundoTemperatura(lead.temperatura)}
    ${lead.temperatura === "quente"
                            ? "border-red-500/50"
                            : lead.temperatura === "morno"
                              ? "border-green-600/100"

                              : "border-blue-500/10"
                          }
  `}
                      >

                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{lead.nome}</h3>
                              <Badge className={corTemperatura(lead.temperatura)}>
                                {lead.temperatura?.toUpperCase()}
                              </Badge>

                            </div>

                            <p className="text-sm">
                              {lead.email} • {lead.telefone}
                            </p>

                            {lead.interesse && (
                              <p className="text-sm font-medium">
                                Interesse: {lead.interesse}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirModalEdit(lead)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedLead(lead);
                                setOpenDelete(true);
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* CREATE */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-[400px] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold">Novo Lead</h2>

            <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />

            <Input placeholder="Quem é o gestor Responsável?" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            <Select value={temperatura} onValueChange={setTemperatura}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Temperatura do Lead" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="FRIO❄️">FRIO❄️</SelectItem>
                <SelectItem value="QUENTE🔥">QUENTE🔥</SelectItem>
                <SelectItem value="MORNO⛅">MORNO⛅</SelectItem>

              </SelectContent>




            </Select>

            <Select value={interesse} onValueChange={setInteresse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Interesse do Lead" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="LOTE🟤">LOTE🟤</SelectItem>
                <SelectItem value="ALUGUEL🏚️">ALUGUEL🏚️</SelectItem>
                <SelectItem value="FINANCIAMENTO💵">FINANCIAMENTO💵</SelectItem>

              </SelectContent>
            </Select>






            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setOpenCreate(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT */}
      {openEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-[400px] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold">Editar Lead</h2>

            <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <Input placeholder="Interesse" value={interesse} onChange={(e) => setInteresse(e.target.value)} />

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setOpenEdit(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {openDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl w-[350px] space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
            <p>
              Tem certeza que deseja excluir <strong>{selectedLead?.nome}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenDelete(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
