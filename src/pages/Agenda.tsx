import { Sidebar } from "@/components/Sidebar";
import { Calendar } from "lucide-react";

const Agenda = () => (
  <div className="flex min-h-screen bg-background">
    <Sidebar />
    <main className="md:ml-16 flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Agenda</h2>
        <p className="text-sm text-muted-foreground">
          Módulo em desenvolvimento. Em breve você poderá visualizar e gerenciar
          seus compromissos e visitas aqui.
        </p>
      </div>
    </main>
  </div>
);

export default Agenda;
