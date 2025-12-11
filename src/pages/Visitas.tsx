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

  // POPUP DE ALERTA
  const [alertPopup, setAlertPopup] = useState<any | null>(null);

  async function loadVisitas() {
    const res: any = await getVisitas();
    const data = res?.data || res || [];

    const normalized = data.map((v: any) => ({
      id: v.id,
      data: v.data,
      anotacoes: v.anotacoes,
      lead: v.lead,
      imovel: v.imovel,
    }));

    setVisitas(normalized);
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

  const filtered = visitas.filter((v) => {
    const q = search.toLowerCase();
    return (
      v?.lead?.nome?.toLowerCase().includes(q) ||
      v?.imovel?.titulo?.toLowerCase().includes(q) ||
      v?.data?.toLowerCase().includes(q)
    );
  });

  // VISITAS DE HOJE
  const hoje = new Date().toISOString().split("T")[0];

  const visitasHoje = visitas.filter((v) => {
    if (!v?.data) return false;
    return String(v.data).startsWith(hoje);
  });

  // RELATÓRIO - ÚLTIMOS 30 DIAS
  const limite = new Date();
  limite.setDate(limite.getDate() - 30);

  const visitas30dias = visitas.filter((v) => {
    if (!v?.data) return false;
    const d = new Date(v.data);
    return !isNaN(d.getTime()) && d >= limite;
  });

  // AGRUPAMENTO PARA GRÁFICOS
  const countByImovel = visitas30dias.reduce((acc: any, v) => {
    const titulo = v.imovel?.titulo || "Sem título";
    acc[titulo] = (acc[titulo] || 0) + 1;
    return acc;
  }, {});

  const topImoveis = Object.entries(countByImovel)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  // ALERTA AUTOMÁTICO
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      visitasHoje.forEach((v) => {
        if (!v?.data) return;
        const dataVisita = new Date(v.data);
        const diff = dataVisita.getTime() - now.getTime();

        if (diff > 0 && diff < 1000 * 60) {
          setAlertPopup(v);
        }
      });
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [visitasHoje]);

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-8 max-w-[1400px] mx-auto">

        {/* LEMBRETE FIXO */}
        {visitasHoje.length > 0 && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg mb-6 flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <b>Você tem {visitasHoje.length} visita(s) marcada(s) para hoje.</b>
          </div>
        )}

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-green-800">Visitas</h1>

          <Button
            className="gap-2 bg-green-700 hover:bg-green-800 text-white"
            onClick={openNew}
          >
            <Plus className="w-5 h-5" />
            Nova Visita
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* LISTA DE VISITAS */}
          <div className="lg:col-span-3">
            <Input
              placeholder="Buscar visita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-6"
            />

            <div className="space-y-4">

              {filtered.map((visit) => {
                const isToday = String(visit.data).startsWith(hoje);

                return (
                  <div
                    key={visit.id}
                    className={`p-5 border rounded-xl shadow-sm flex justify-between transition
                      ${isToday ? "bg-green-100 border-green-300" : "bg-white"}
                    `}
                  >
                    {/* ESQUERDA */}
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {visit.lead?.nome}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {visit.imovel?.titulo}
                      </p>

                      <div className="mt-3 flex gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-700" />
                          {visit.data}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-700" />
                          {visit.imovel?.bairro}
                        </div>
                      </div>

                      {isToday && (
                        <span className="mt-2 inline-block bg-green-700 text-white text-xs font-semibold px-2 py-1 rounded-md w-fit">
                          Hoje
                        </span>
                      )}
                    </div>

                    {/* DIREITA */}
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => openView(visit)}>
                        Ver
                      </Button>

                      <Button
                        size="sm"
                        className="bg-green-700 text-white hover:bg-green-800"
                        onClick={() => openEdit(visit)}
                      >
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

              {filtered.length === 0 && (
                <p className="text-gray-500 mt-6">Nenhuma visita encontrada.</p>
              )}
            </div>
          </div>

          {/* PAINEL LATERAL */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-lg shadow-md sticky top-10 p-5">

              {/* ABAS */}
              <div className="flex mb-4 border-b">
                <button
                  onClick={() => setActiveTab("hoje")}
                  className={`px-4 py-2 ${activeTab === "hoje"
                      ? "font-bold border-b-2 border-green-700 text-green-700"
                      : "text-gray-500"
                    }`}
                >
                  Hoje
                </button>

                <button
                  onClick={() => setActiveTab("relatorio")}
                  className={`px-4 py-2 ${activeTab === "relatorio"
                      ? "font-bold border-b-2 border-green-700 text-green-700"
                      : "text-gray-500"
                    }`}
                >
                  Últimos 30 dias
                </button>
              </div>

              {/* ABA HOJE */}
              {activeTab === "hoje" && (
                <div>
                  {visitasHoje.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhuma visita hoje.</p>
                  ) : (
                    visitasHoje.map((v) => (
                      <div key={v.id} className="p-3 mb-3 bg-green-50 border border-green-200 rounded">
                        <p className="font-semibold text-green-800">{v.lead?.nome}</p>
                        <p className="text-sm text-green-700">{v.data}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ABA RELATÓRIO */}
              {activeTab === "relatorio" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-green-800">
                    Total: {visitas30dias.length} visitas
                  </h3>

                  <div>
                    <h4 className="font-semibold mb-2">Imóveis mais visitados</h4>

                    {topImoveis.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum imóvel encontrado nos últimos 30 dias.</p>
                    ) : (
                      topImoveis.map(([titulo, count]: any) => (
                        <div key={titulo} className="mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[140px]">{titulo}</span>
                            <span>{count}</span>
                          </div>

                          <div className="h-3 bg-green-100 rounded">
                            <div
                              className="h-3 bg-green-600 rounded"
                              style={{
                                width: `${(count / (topImoveis[0] ? topImoveis[0][1] : 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* POPUP ALERT */}
      {alertPopup && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl border p-5 rounded-lg w-80 animate-fadeIn">
          <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Visita Agora!
          </h3>

          <p className="mt-2"><b>Lead:</b> {alertPopup.lead?.nome}</p>
          <p><b>Imóvel:</b> {alertPopup.imovel?.titulo}</p>
          <p><b>Horário:</b> {alertPopup.data}</p>

          <Button
            className="mt-4 w-full bg-green-700 text-white"
            onClick={() => setAlertPopup(null)}
          >
            OK
          </Button>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR */}
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
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>{lead.nome}</option>
              ))}
            </select>

            <select
              className="w-full border p-2 rounded"
              value={form.imovel_id}
              onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
            >
              <option value="">Selecione o imóvel</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>{i.titulo}</option>
              ))}
            </select>

            <Input
              placeholder="Anotações"
              value={form.anotacoes}
              onChange={(e) => setForm({ ...form, anotacoes: e.target.value })}
            />

            <Button className="w-full bg-green-700 text-white" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL VER */}
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
                <Button
                  className="bg-green-700 text-white"
                  onClick={() => {
                    setViewOpen(false);
                    openEdit(selected);
                  }}
                >
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
