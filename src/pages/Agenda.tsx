import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Funções de integração com o Supabase
import { createAgenda } from "@/integrations/supabase/agenda/createAgenda"; // Para criar um evento
import { deleteAgenda } from "@/integrations/supabase/agenda/deleteAgenda"; // Para excluir um evento
import { getAgenda } from "@/integrations/supabase/agenda/getAgenda"; // Para buscar os eventos

const Agenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "" });
  const [editing, setEditing] = useState<any | null>(null);

  // Função para carregar eventos
  const loadEvents = async () => {
    const data = await getAgenda();
    setEvents(data);
  };

  // Carregar eventos assim que o componente for montado
  useEffect(() => {
    loadEvents();
  }, []);

  // Abrir o modal para criar evento
  const openNew = () => {
    setEditing(null);
    setForm({ title: "", date: "", time: "", location: "" });
    setModalOpen(true);
  };

  // Abrir o modal para editar evento
  const openEdit = (event: any) => {
    setEditing(event);
    setForm({ title: event.title, date: event.date, time: event.time, location: event.location });
    setModalOpen(true);
  };

  // Salvar evento (criar ou editar)
  const saveEvent = async () => {
    if (!form.title || !form.date || !form.time || !form.location) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    const payload = { ...form };

    if (editing) {
      await createAgenda({ ...payload, id: editing.id }); // Update
    } else {
      await createAgenda(payload); // Create
    }

    setModalOpen(false);
    setForm({ title: "", date: "", time: "", location: "" });
    loadEvents(); // Recarregar eventos após salvar
  };

  // Excluir evento
  const deleteEvent = async (id: string) => {
    if (!confirm("Deseja realmente excluir este evento?")) return;
    await deleteAgenda(id);
    loadEvents(); // Recarregar eventos após exclusão
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* CONTEÚDO AJUSTADO À SIDEBAR FIXA */}
      <main className="ml-16 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            
           
          </div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
              <p className="text-muted-foreground mt-2">Gerencie seus compromissos e visitas agendadas</p>
            </div>

            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </div>

          {/* Event List */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Compromissos</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>

                        <p className="font-medium text-foreground">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(event)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* MODAL CRIAR/EDITAR */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Data"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Input
              placeholder="Hora"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
            <Input
              placeholder="Localização"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <Button className="w-full mt-4" onClick={saveEvent}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
