import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const STALE = 1000 * 60 * 3;

const STATUS_LABEL: Record<string, string> = {
  novo_cliente:     "Novo",
  em_contato:       "Em contato",
  visita_marcada:   "Visita",
  proposta_enviada: "Proposta",
  cliente_desistiu: "Desistiu",
};

const STATUS_CLASS: Record<string, string> = {
  novo_cliente:     "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  em_contato:       "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  visita_marcada:   "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  proposta_enviada: "bg-green-500/10 text-green-600 dark:text-green-400",
  cliente_desistiu: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const LeadsEquipe = () => {
  const [search, setSearch] = useState("");
  const [filtroCorretor, setFiltroCorretor] = useState("todos");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["org-equipe-leads"],
    queryFn: orgService.getEquipeLeads,
    staleTime: STALE,
  });

  const corretores = Array.from(new Set(leads.map((l) => l.corretor_name))).sort();

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.name?.toLowerCase().includes(q) ||
      l.telefone?.toLowerCase().includes(q) ||
      l.corretor_name?.toLowerCase().includes(q);
    const matchCorretor = filtroCorretor === "todos" || l.corretor_name === filtroCorretor;
    return matchSearch && matchCorretor;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 w-full overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-8 space-y-5">

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Leads da equipe</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Todos os leads de todos os corretores</p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lead ou corretor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filtroCorretor}
              onChange={(e) => setFiltroCorretor(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="todos">Todos os corretores</option>
              {corretores.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Telefone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Interesse</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Corretor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                        Nenhum lead encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.map((lead) => (
                      <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.telefone}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-[160px]">{lead.interesse ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[lead.status] ?? "bg-muted text-muted-foreground"}`}>
                            {STATUS_LABEL[lead.status] ?? lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                            {lead.corretor_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div className="px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeadsEquipe;
