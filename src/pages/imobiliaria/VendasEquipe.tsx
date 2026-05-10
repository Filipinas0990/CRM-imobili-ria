import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { orgService } from "@/services/org.service";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp } from "lucide-react";

const STALE = 1000 * 60 * 3;

const fmt = (v: string | number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const STATUS_CLASS: Record<string, string> = {
  "Em negociação":    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  "Proposta enviada": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Fechada":          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Concluída":        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Perdida":          "bg-red-500/10 text-red-600 dark:text-red-400",
  "Cancelada":        "bg-red-500/10 text-red-600 dark:text-red-400",
};

const VendasEquipe = () => {
  const [search, setSearch] = useState("");
  const [filtroCorretor, setFiltroCorretor] = useState("todos");

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ["org-equipe-vendas"],
    queryFn: orgService.getEquipeVendas,
    staleTime: STALE,
  });

  const corretores = Array.from(new Set(vendas.map((v) => v.corretor_name))).sort();

  const filtered = vendas.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.tipo?.toLowerCase().includes(q) ||
      v.corretor_name?.toLowerCase().includes(q);
    const matchCorretor = filtroCorretor === "todos" || v.corretor_name === filtroCorretor;
    return matchSearch && matchCorretor;
  });

  const totalValor = filtered.reduce((acc, v) => acc + Number(v.valor), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="md:ml-16 w-full overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-8 space-y-5">

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Vendas da equipe</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Todas as vendas de todos os corretores</p>
            </div>
            {filtered.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Total filtrado</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalValor)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo ou corretor..."
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Corretor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Data venda</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Construtora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  ) : (
                    filtered.map((venda) => (
                      <tr key={venda.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground capitalize">{venda.tipo ?? "—"}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{fmt(venda.valor)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[venda.status] ?? "bg-muted text-muted-foreground"}`}>
                            {venda.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                            {venda.corretor_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                          {venda.data_venda ? new Date(venda.data_venda).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs truncate max-w-[140px]">
                          {venda.construtora ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div className="px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground flex justify-between">
                  <span>{filtered.length} {filtered.length === 1 ? "venda" : "vendas"}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalValor)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendasEquipe;
