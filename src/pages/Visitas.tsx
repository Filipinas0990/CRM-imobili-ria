import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Bell } from "lucide-react";

// VISITAS
import { getVisitas } from "@/integrations/supabase/visistas/getVisitas";
import { createVisita } from "@/integrations/supabase/visistas/createVisita";
import { updateVisita } from "@/integrations/supabase/visistas/updateVisita";
import { deleteVisita } from "@/integrations/supabase/visistas/deleteVisita";

// LEADS
import { getLeads } from "@/integrations/supabase/leads/getLeads";

// IMÓVEIS
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";

export default function Visitas() {
  const [visitas, setVisitas] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

  const [form, setForm] = useState({
    data: "",
    anotacoes: "",
    lead_id: "",
    imovel_id: "",
  });

  const [activeTab, setActiveTab] = useState<"hoje" | "relatorio">("hoje");
  const [alertPopup, setAlertPopup] = useState<any | null>(null);

  async function loadVisitas() {
    const res: any = await getVisitas();
    const data = res?.data || res || [];
    setVisitas(data);
  }

  async function loadLeads() {
    const res: any = await getLeads();
    setLeads(res?.data || res || []);
  }

  async function loadImoveis() {
    const res: any = await getImoveis();
    setImoveis(res?.data || res || []);
  }

  useEffect(() => {
    loadVisitas();
    loadLeads();
    loadImoveis();
  }, []);

  function openNew() {
    setEditing(null);
    setForm({ data: "", anotacoes: "", lead_id: "", imovel_id: "" });
    setModalOpen(true);
  }

  function openEdit(v: any) {
    setEditing(v);
    setForm({
      data: v.data,
      anotacoes: v.anotacoes,
      lead_id: v.lead?.id || "",
      imovel_id: v.imovel?.id || "",
    });
    setModalOpen(true);
  }

  function openView(v: any) {
    setSelected(v);
    setViewOpen(true);
  }

  async function handleSave() {
    if (!form.data || !form.lead_id || !form.imovel_id) {
      alert("Preencha todos os campos.");
      return;
    }

    const payload = {
      data: form.data,
      anotacoes: form.anotacoes,
      lead_id: form.lead_id,
      imovel_id: form.imovel_id,
    };

    if (editing) await updateVisita(editing.id, payload);
    else await createVisita(payload);

    setModalOpen(false);
    loadVisitas();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir visita?")) return;
    await deleteVisita(id);
    loadVisitas();
  }

  const hoje = new Date().toISOString().split("T")[0];

  const visitasHoje = visitas.filter(
    (v) => v?.data && String(v.data).startsWith(hoje)
  );

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      visitasHoje.forEach((v) => {
        const d = new Date(v.data);
        const diff = d.getTime() - now.getTime();
        if (diff > 0 && diff < 1000 * 60) setAlertPopup(v);
      });
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [visitasHoje]);

  const filtered = visitas.filter((v) => {
    const q = search.toLowerCase();
    return (
      v?.lead?.nome?.toLowerCase().includes(q) ||
      v?.imovel?.titulo?.toLowerCase().includes(q) ||
      v?.data?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* CONTEÚDO AJUSTADO À SIDEBAR */}
      <main className="ml-16 overflow-y-auto">
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">

          {visitasHoje.length > 0 && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <b>Você tem {visitasHoje.length} visita(s) marcada(s) para hoje.</b>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">Visitas</h1>

            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-5 h-5" />
              Nova Visita
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <Input
                placeholder="Buscar visita..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {filtered.map((visit) => {
                const isToday = String(visit.data).startsWith(hoje);

                return (
                  <div
                    key={visit.id}
                    className={`p-5 border rounded-xl flex justify-between ${isToday ? "bg-primary/10 border-primary" : "bg-card"
                      }`}
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{visit.lead?.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {visit.imovel?.titulo}
                      </p>

                      <div className="mt-3 flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {visit.data}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {visit.imovel?.bairro}
                        </div>
                      </div>

                      {isToday && (
                        <span className="mt-2 inline-block text-xs font-semibold px-2 py-1 rounded bg-primary text-white">
                          Hoje
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => openView(visit)}>
                        Ver
                      </Button>
                      <Button size="sm" onClick={() => openEdit(visit)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(visit.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-10 border rounded-lg p-5 bg-card">
                <div className="flex border-b mb-4">
                  <button
                    onClick={() => setActiveTab("hoje")}
                    className={`px-4 py-2 ${activeTab === "hoje"
                        ? "border-b-2 border-primary font-bold"
                        : "text-muted-foreground"
                      }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setActiveTab("relatorio")}
                    className={`px-4 py-2 ${activeTab === "relatorio"
                        ? "border-b-2 border-primary font-bold"
                        : "text-muted-foreground"
                      }`}
                  >
                    Últimos 30 dias
                  </button>
                </div>

                {activeTab === "hoje" && (
                  <div className="space-y-3">
                    {visitasHoje.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma visita hoje.
                      </p>
                    ) : (
                      visitasHoje.map((v) => (
                        <div key={v.id} className="p-3 rounded bg-primary/10">
                          <p className="font-semibold">{v.lead?.nome}</p>
                          <p className="text-sm">{v.data}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "relatorio" && (
                  <p className="text-sm text-muted-foreground">
                    Relatório visual pode ser conectado aqui.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ALERTA */}
      {alertPopup && (
        <div className="fixed bottom-6 right-6 bg-card border p-5 rounded-lg w-80 shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Visita Agora!
          </h3>

          <p className="mt-2">
            <b>Lead:</b> {alertPopup.lead?.nome}
          </p>
          <p>
            <b>Imóvel:</b> {alertPopup.imovel?.titulo}
          </p>
          <p>
            <b>Horário:</b> {alertPopup.data}
          </p>

          <Button className="mt-4 w-full" onClick={() => setAlertPopup(null)}>
            OK
          </Button>
        </div>
      )}

      {/* MODAIS */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Visita" : "Nova Visita"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="datetime-local"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />

            <select
              className="w-full border p-2 rounded"
              value={form.lead_id}
              onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
            >
              <option value="">Selecione o lead</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>

            <select
              className="w-full border p-2 rounded"
              value={form.imovel_id}
              onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
            >
              <option value="">Selecione o imóvel</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.titulo}
                </option>
              ))}
            </select>

            <Input
              placeholder="Anotações"
              value={form.anotacoes}
              onChange={(e) => setForm({ ...form, anotacoes: e.target.value })}
            />

            <Button className="w-full" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Visita</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <p><b>Lead:</b> {selected.lead?.nome}</p>
              <p><b>Imóvel:</b> {selected.imovel?.titulo}</p>
              <p><b>Data:</b> {selected.data}</p>
              <p><b>Anotações:</b> {selected.anotacoes}</p>

              <div className="flex gap-2 pt-3">
                <Button onClick={() => { setViewOpen(false); openEdit(selected); }}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(selected.id)}>
                  Excluir
                </Button>
                <Button variant="ghost" onClick={() => setViewOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
