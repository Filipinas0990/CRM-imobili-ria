import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import type { LeadEquipe } from "@/services/org.service";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const STALE = 1000 * 60 * 3;

const ETAPAS = [
  { key: "novo_cliente",     title: "Novo Cliente",      dot: "bg-purple-500" },
  { key: "em_contato",       title: "Em contato",        dot: "bg-yellow-500" },
  { key: "visita_marcada",   title: "Visita Marcada",    dot: "bg-orange-500" },
  { key: "proposta_enviada", title: "Proposta Enviada",  dot: "bg-green-600"  },
  { key: "cliente_desistiu", title: "Cliente desistiu",  dot: "bg-red-500"    },
];

const AVATAR_COLORS = [
  "bg-purple-600", "bg-blue-600", "bg-pink-600",
  "bg-orange-500", "bg-teal-600", "bg-indigo-600",
];

function avatarColor(nome: string) {
  return AVATAR_COLORS[nome.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function LeadCard({ lead }: { lead: LeadEquipe }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${avatarColor(lead.name ?? "")} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {initials(lead.name ?? "?")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.telefone}</p>
        </div>
      </div>
      {lead.interesse && (
        <p className="text-xs text-muted-foreground truncate">📍 {lead.interesse}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium truncate max-w-[120px]">
          {lead.corretor_name}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

const PipelineEquipe = () => {
  const [search, setSearch] = useState("");

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["org-pipeline"],
    queryFn: orgService.getPipeline,
    staleTime: STALE,
  });

  const filter = (leads: LeadEquipe[]) => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.telefone?.toLowerCase().includes(q) ||
        l.corretor_name?.toLowerCase().includes(q)
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 w-full overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-8 space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Pipeline da equipe</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Todos os leads de todos os corretores</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lead ou corretor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ETAPAS.map((etapa) => {
                const leads = filter((pipeline as Record<string, LeadEquipe[]>)?.[etapa.key] ?? []);
                return (
                  <div key={etapa.key} className="flex-shrink-0 w-[260px] space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${etapa.dot}`} />
                      <span className="text-sm font-semibold text-foreground">{etapa.title}</span>
                      <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {leads.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                      {leads.length === 0 ? (
                        <div className="h-20 flex items-center justify-center rounded-xl border border-dashed border-border">
                          <p className="text-xs text-muted-foreground">Nenhum lead</p>
                        </div>
                      ) : (
                        leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PipelineEquipe;
