import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Supabase
import { createAgenda } from "@/integrations/supabase/agenda/createAgenda";
import { deleteAgenda } from "@/integrations/supabase/agenda/deleteAgenda";
import { getAgenda } from "@/integrations/supabase/agenda/getAgenda";

const Agenda = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    categoria: "",
  });

  const loadEvents = async () => {
    const data = await getAgenda();
    setEvents(data || []);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "",
      date: "",
      time: "",
      location: "",
      categoria: "",
    });
    setModalOpen(true);
  };

  const openEdit = (event: any) => {
    setEditing(event);
    setForm({
      title: event.title,
      date: event.date?.split("T")[0] ?? "",
      time: event.time,
      location: event.location,
      categoria: event.categoria,
    });
    setModalOpen(true);
  };

  const saveEvent = async () => {
    if (
      !form.title ||
      !form.date ||
      !form.time ||
      !form.location ||
      !form.categoria
    ) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    const payload = { ...form };

    if (editing) {
      await createAgenda({ ...payload, id: editing.id });
    } else {
      await createAgenda(payload);
    }

    setModalOpen(false);
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Deseja realmente excluir este evento?")) return;
    await deleteAgenda(id);
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-16 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Agenda</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie seus compromissos e visitas agendadas
              </p>
            </div>

            <Button className="gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Compromissos</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{event.title}</h3>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>

                        <span className="font-medium">
                          {event.location}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {event.categoria}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(event)}
                      >
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

      {/* MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Título"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />

            <input
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />

            <Input
              placeholder="Localização"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />

            {/* SELECT CATEGORIA */}
            <Select
              value={form.categoria}
              onValueChange={(value) =>
                setForm({ ...form, categoria: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Comissão de venda">
                  Comissão de venda
                </SelectItem>
                <SelectItem value="Comissão de aluguel">
                  Comissão de aluguel
                </SelectItem>
                <SelectItem value="Aluguel recebido">
                  Aluguel recebido
                </SelectItem>
                <SelectItem value="Taxa administrativa">
                  Taxa administrativa
                </SelectItem>
                <SelectItem value="Outros recebimentos">
                  Outros recebimentos
                </SelectItem>
              </SelectContent>
            </Select>

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
