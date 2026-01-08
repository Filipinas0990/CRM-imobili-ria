import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Plus,
  Trash,
  MapPin,
  Search,
  Pencil,
} from "lucide-react";
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
  const [search, setSearch] = useState("");

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
    if (!form.title || !form.date || !form.time || !form.location) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    if (editing) {
      await createAgenda({ ...form, id: editing.id });
    } else {
      await createAgenda(form);
    }

    setModalOpen(false);
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Deseja realmente excluir este evento?")) return;
    await deleteAgenda(id);
    loadEvents();
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="ml-16 p-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus compromissos e visitas agendadas
            </p>
          </div>

          <Button className="gap-2" onClick={openNew}>
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        </div>

        {/* CARD PRINCIPAL */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Compromissos
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* BUSCA */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar compromisso..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* LISTA */}
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between bg-background border rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary rounded-xl p-3">
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold">{event.title}</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {event.categoria}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => openEdit(event)}
                  >
                    <Pencil className="w-4 h-4" />
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
            ))}
          </CardContent>
        </Card>
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
              className="w-full border rounded-md px-3 py-2"
            />

            <input
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2"
            />

            <Input
              placeholder="Localização"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />

            <Select
              value={form.categoria}
              onValueChange={(value) =>
                setForm({ ...form, categoria: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Ligações">Ligações</SelectItem>
                <SelectItem value="Prospecção">Prospecção</SelectItem>
                <SelectItem value="Treinamento">Treinamento</SelectItem>
                <SelectItem value="Pessoal">Pessoal</SelectItem>
              </SelectContent>
            </Select>

            <Button className="w-full" onClick={saveEvent}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
