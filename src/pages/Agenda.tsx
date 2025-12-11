import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Visita com João Silva",
    date: "2025-02-15",
    time: "14:00",
    location: "Apto 302 - Centro",
  },
  {
    id: 2,
    title: "Reunião com equipe",
    date: "2025-02-16",
    time: "09:30",
    location: "Imobiliária - Sala 2",
  },
  {
    id: 3,
    title: "Visita com Maria Santos",
    date: "2025-02-17",
    time: "16:00",
    location: "Casa - Jardim Europa",
  },
];

const Agenda = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie seus compromissos e visitas agendadas
              </p>
            </div>

            <Button className="gap-2">
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
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">
                        {event.title}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>

                        <p className="font-medium text-foreground">
                          {event.location}
                        </p>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Agenda;
