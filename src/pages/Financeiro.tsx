import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Wallet, Plus, Trash } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fluxoService, type FluxoItem } from "@/services/fluxo.service";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Transaction = FluxoItem & { tipo: 'entrada' | 'saida' };

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const PIE_COLORS = [
  "#22c55e", "#3b82f6", "#06b6d4", "#8b5cf6", "#a3e635",
  "#f97316", "#eab308", "#ec4899", "#6366f1", "#14b8a6", "#94a3b8",
];

const STALE = 1000 * 60 * 5;

export default function Balanco() {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  const hoje = new Date();
  const [mesFiltro, setMesFiltro] = useState<string>(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  );

  const queryClient = useQueryClient();

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["fluxo-caixa"],
    queryFn: () => fluxoService.getAll({ status: "confirmado" }),
    staleTime: STALE,
  });

  // Só entradas e saídas (exclui despesas fixas tipo='financeiro')
  const transactions = useMemo(
    () => allItems.filter((t): t is Transaction => t.tipo === "entrada" || t.tipo === "saida"),
    [allItems]
  );

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["fluxo-caixa"] });
  }

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    set.add(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`);
    transactions.forEach((t) => {
      const d = new Date(t.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const transacoesFiltradas = useMemo(() => {
    if (mesFiltro === "all") return transactions;
    return transactions.filter((t) => {
      const d = new Date(t.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === mesFiltro;
    });
  }, [transactions, mesFiltro]);

  const resumo = useMemo(() => {
    let entradas = 0; let saidas = 0;
    transacoesFiltradas.forEach((t) => {
      if (t.tipo === "entrada") entradas += Number(t.valor);
      if (t.tipo === "saida")   saidas  += Number(t.valor);
    });
    return { entradas, saidas, saldo: entradas - saidas };
  }, [transacoesFiltradas]);

  const barData = useMemo(() => {
    if (mesFiltro === "all") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
        const mesLabel = MESES[d.getMonth()];
        const ano = d.getFullYear(); const mes = d.getMonth();
        let receita = 0; let despesa = 0;
        transactions.forEach((t) => {
          const tDate = new Date(t.data);
          if (tDate.getFullYear() === ano && tDate.getMonth() === mes) {
            if (t.tipo === "entrada") receita += Number(t.valor);
            if (t.tipo === "saida")   despesa += Number(t.valor);
          }
        });
        return { mes: mesLabel, Receita: receita, Despesa: despesa };
      });
    } else {
      const semanas = [
        { mes: "Sem 1", Receita: 0, Despesa: 0 },
        { mes: "Sem 2", Receita: 0, Despesa: 0 },
        { mes: "Sem 3", Receita: 0, Despesa: 0 },
        { mes: "Sem 4", Receita: 0, Despesa: 0 },
      ];
      transacoesFiltradas.forEach((t) => {
        const dia = new Date(t.data).getDate();
        const semIdx = Math.min(Math.floor((dia - 1) / 7), 3);
        if (t.tipo === "entrada") semanas[semIdx].Receita += Number(t.valor);
        if (t.tipo === "saida")   semanas[semIdx].Despesa += Number(t.valor);
      });
      return semanas;
    }
  }, [transactions, transacoesFiltradas, mesFiltro]);

  const pieData = useMemo(() => {
    const grupos: Record<string, number> = {};
    transacoesFiltradas.filter((t) => t.tipo === "entrada").forEach((t) => {
      const cat = t.categoria || "Sem categoria";
      grupos[cat] = (grupos[cat] || 0) + Number(t.valor);
    });
    return Object.entries(grupos).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [transacoesFiltradas]);

  async function salvar() {
    if (!descricao || !valor || !categoria) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSalvando(true);
    try {
      await fluxoService.create({
        descricao,
        valor: Number(valor),
        categoria,
        tipo,
        data,
        status: "confirmado",
      });
      setDescricao(""); setValor(""); setCategoria(""); setTipo("entrada");
      setOpen(false);
      invalidar();
      toast.success("Transação cadastrada!");
    } catch {
      toast.error("Erro ao cadastrar transação");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDelete() {
    if (!deleteId) return;
    setLoadingDelete(true);
    try {
      await fluxoService.delete(deleteId);
      setDeleteId(null);
      setOpenDelete(false);
      invalidar();
      toast.success("Transação excluída");
    } catch {
      toast.error("Erro ao excluir transação");
    } finally {
      setLoadingDelete(false);
    }
  }

  function formatarMesLabel(key: string) {
    if (key === "all") return "Todos os meses";
    const [ano, mes] = key.split("-");
    return `${MESES_FULL[parseInt(mes) - 1]} ${ano}`;
  }

  const modalNovaTransacao = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input className="rounded-xl" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input className="rounded-xl" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
              <SelectContent>
                {tipo === "entrada" && (<>
                  <SelectItem value="Comissão de venda">Comissão de venda</SelectItem>
                  <SelectItem value="Comissão de aluguel">Comissão de aluguel</SelectItem>
                  <SelectItem value="Aluguel recebido">Aluguel recebido</SelectItem>
                  <SelectItem value="Taxa administrativa">Taxa administrativa</SelectItem>
                  <SelectItem value="Outros recebimentos">Outros recebimentos</SelectItem>
                </>)}
                {tipo === "saida" && (<>
                  <SelectItem value="Comissão corretor">Comissão corretor</SelectItem>
                  <SelectItem value="Anúncios / Marketing">Anúncios / Marketing</SelectItem>
                  <SelectItem value="Portais imobiliários">Portais imobiliários</SelectItem>
                  <SelectItem value="Salários">Salários</SelectItem>
                  <SelectItem value="Ferramentas / Sistemas">Ferramentas / Sistemas</SelectItem>
                  <SelectItem value="Impostos">Impostos</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Outros custos">Outros custos</SelectItem>
                </>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input className="rounded-xl" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* DESKTOP */}
      <main className="hidden md:block flex-1 ml-20 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground mt-2">Controle financeiro e comissões</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={mesFiltro} onValueChange={setMesFiltro}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {mesesDisponiveis.map((key) => (
                  <SelectItem key={key} value={key}>{formatarMesLabel(key)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modalNovaTransacao}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm">Entradas</CardTitle>
              <ArrowUp className="text-green-500" />
            </CardHeader>
            <CardContent className="text-3xl font-bold">R$ {resumo.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm">Saídas</CardTitle>
              <ArrowDown className="text-red-500" />
            </CardHeader>
            <CardContent className="text-3xl font-bold">R$ {resumo.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm">Saldo</CardTitle>
              <Wallet />
            </CardHeader>
            <CardContent className={`text-3xl font-bold ${resumo.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {resumo.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Receita vs Despesa
                {mesFiltro !== "all" && <span className="text-muted-foreground font-normal text-sm ml-2">— {formatarMesLabel(mesFiltro)}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Receitas por Categoria
                {mesFiltro !== "all" && <span className="text-muted-foreground font-normal text-sm ml-2">— {formatarMesLabel(mesFiltro)}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {pieData.length > 0 ? (<>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                      {pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [`R$ ${v.toLocaleString("pt-BR")}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full max-h-40 overflow-y-auto mt-2 space-y-1 pr-1">
                  {pieData.map((entry, index) => {
                    const total = pieData.reduce((acc, d) => acc + d.value, 0);
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="truncate text-muted-foreground">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="font-medium">R$ {entry.value.toLocaleString("pt-BR")}</span>
                          <span className="text-muted-foreground text-xs w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>) : (
                <p className="text-muted-foreground text-sm py-10">Sem receitas neste período.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {transacoesFiltradas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação neste período.</p>
            ) : transacoesFiltradas.map((t) => (
              <div key={t.id} className="flex justify-between items-center border rounded-lg p-4 hover:bg-muted/40 transition">
                <div>
                  <p className="font-medium">{t.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                    {t.tipo === "entrada" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <Button size="icon" className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    onClick={() => { setDeleteId(t.id); setOpenDelete(true); }}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      {/* MOBILE */}
      <main className="md:hidden flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Financeiro</h1>
              <p className="text-muted-foreground text-sm">Controle financeiro</p>
            </div>
            {modalNovaTransacao}
          </div>

          <Select value={mesFiltro} onValueChange={setMesFiltro}>
            <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Filtrar mês" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {mesesDisponiveis.map((key) => (
                <SelectItem key={key} value={key}>{formatarMesLabel(key)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border bg-green-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowUp className="w-3.5 h-3.5 text-green-600" />
                <p className="text-xs font-medium text-green-700">Entradas</p>
              </div>
              <p className="text-sm font-bold text-green-700">R$ {resumo.entradas.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-2xl border bg-red-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                <p className="text-xs font-medium text-red-700">Saídas</p>
              </div>
              <p className="text-sm font-bold text-red-700">R$ {resumo.saidas.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-2xl border bg-blue-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-xs font-medium text-blue-700">Saldo</p>
              </div>
              <p className={`text-sm font-bold ${resumo.saldo >= 0 ? "text-blue-700" : "text-red-700"}`}>
                R$ {resumo.saldo.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm font-semibold mb-3">
              Receita vs Despesa
              {mesFiltro !== "all" && <span className="text-muted-foreground font-normal ml-1">— {formatarMesLabel(mesFiltro)}</span>}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barCategoryGap="30%">
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                <Bar dataKey="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Transações Recentes</p>
            <div className="space-y-2">
              {transacoesFiltradas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Wallet className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma transação neste período</p>
                </div>
              )}
              {transacoesFiltradas.map((t) => (
                <div key={t.id} className="relative rounded-2xl border bg-card overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.tipo === "entrada" ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="pl-4 pr-3 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{t.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-bold text-sm ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                        {t.tipo === "entrada" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR")}
                      </span>
                      <button className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                        onClick={() => { setDeleteId(t.id); setOpenDelete(true); }}>
                        <Trash className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpenDelete(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl" disabled={loadingDelete} onClick={confirmarDelete}>
              {loadingDelete ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
