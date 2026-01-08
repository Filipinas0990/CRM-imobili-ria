import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Bell, Eye } from "lucide-react";

// VISITAS
import { getVisitas } from "@/integrations/supabase/visistas/getVisitas";
import { createVisita } from "@/integrations/supabase/visistas/createVisita";
import { updateVisita } from "@/integrations/supabase/visistas/updateVisita";
import { deleteVisita } from "@/integrations/supabase/visistas/deleteVisita";

// LEADS
import { getLeads } from "@/integrations/supabase/leads/getLeads";

// IMÓVEIS
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    setVisitas(res?.data || res || []);
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

    editing
      ? await updateVisita(editing.id, payload)
      : await createVisita(payload);

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

  const filtered = visitas.filter((v) => {
    const q = search.toLowerCase();
    return (
      v?.lead?.nome?.toLowerCase().includes(q) ||
      v?.imovel?.titulo?.toLowerCase().includes(q)
    );
  });
  function formatarData(data: string) {
    if (!data) return "—";

    const d = new Date(data);

    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " às " + d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  useEffect(() => {
    if (selected) {
      console.log("SELECTED VISITA:", selected);
    }
  }, [selected]);

  return (
    <div className="min-h-screen bg-[#f4f6f5]">
      <Sidebar />

      <main className="ml-16">
        <div className="max-w-[1500px] mx-auto p-10 space-y-10">

          {visitasHoje.length > 0 && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-xl flex items-center gap-3">
              <Bell className="w-5 h-5" />
              Você tem {visitasHoje.length} visita(s) marcada(s) para hoje.
            </div>
          )}

          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-800">Visitas</h1>

            <Button onClick={openNew} className="gap-2 px-6 py-5 rounded-xl shadow-md">
              <Plus className="w-5 h-5" />
              Nova Visita
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-5">
              <Input
                placeholder="Buscar visita..."
                className="h-12 rounded-xl shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {filtered.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-white rounded-2xl shadow-sm p-6 flex justify-between hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {visit.imovel?.titulo}
                      </h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                        Agendada
                      </span>
                    </div>

                    <div className="flex gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {visit.data}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {visit.imovel?.bairro || "Endereço oculto"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Button size="sm" variant="outline" onClick={() => openView(visit)}>
                      <Eye className="w-4 h-4 mr-1" />
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
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-10">
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab("hoje")}
                  className={`px-4 py-2 ${activeTab === "hoje"
                    ? "border-b-2 border-primary font-semibold"
                    : "text-muted-foreground"
                    }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setActiveTab("relatorio")}
                  className={`px-4 py-2 ${activeTab === "relatorio"
                    ? "border-b-2 border-primary font-semibold"
                    : "text-muted-foreground"
                    }`}
                >
                  Últimos 30 dias
                </button>
              </div>

              {activeTab === "hoje" && (
                visitasHoje.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center mt-10">
                    Nenhuma visita hoje.
                  </p>
                ) : (
                  visitasHoje.map((v) => (
                    <div key={v.id} className="p-3 rounded-lg bg-primary/10 mb-2">
                      <p className="font-medium">{v.lead?.nome}</p>
                      <p className="text-xs">{v.data}</p>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL NOVA / EDITAR */}
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

            <div className="space-y-2">
              <Label>Lead</Label>
              <Select
                value={form.lead_id}
                onValueChange={(value) =>
                  setForm({ ...form, lead_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Imóvel</Label>
              <Select
                value={form.imovel_id}
                onValueChange={(value) =>
                  setForm({ ...form, imovel_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {imoveis.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Anotações"
              value={form.anotacoes}
              onChange={(e) =>
                setForm({ ...form, anotacoes: e.target.value })
              }
            />

            <Button className="w-full" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL VISUALIZAR */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Visita</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              <p>
                <b>Lead:</b>{" "}
                {selected.lead?.nome ||
                  leads.find(l => l.id === selected.lead_id)?.nome ||
                  "—"}
              </p>
              <p><b>Imóvel:</b> {selected.imovel?.titulo}</p>
              <p>
                <b>Data:</b> {formatarData(selected.data)}
              </p>
              <p><b>Anotações:</b> {selected.anotacoes}</p>

              <div className="flex gap-2 pt-4">
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
