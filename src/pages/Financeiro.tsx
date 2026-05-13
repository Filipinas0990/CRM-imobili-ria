import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUp, ArrowDown, Wallet, Plus, Search,
  MoreHorizontal, TrendingUp, CheckCircle2, Clock, DollarSign,
  RefreshCw, Calendar,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

type Transaction = FluxoItem & { tipo: "entrada" | "saida" };

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const PIE_COLORS = [
  "#22c55e","#3b82f6","#06b6d4","#8b5cf6","#a3e635",
  "#f97316","#eab308","#ec4899","#6366f1","#14b8a6","#94a3b8",
];

const CATEGORIA_GRUPO: Record<string, string> = {
  "Comissão de venda": "Imobiliário",
  "Comissão de aluguel": "Imobiliário",
  "Aluguel recebido": "Imobiliário",
  "Taxa administrativa": "Operacional",
  "Outros recebimentos": "Outros",
  "Comissão corretor": "Imobiliário",
  "Anúncios / Marketing": "Marketing",
  "Portais imobiliários": "Marketing",
  "Salários": "Operacional",
  "Ferramentas / Sistemas": "Operacional",
  "Impostos": "Fiscal",
  "Manutenção": "Operacional",
  "Outros custos": "Outros",
};

const STALE = 1000 * 60 * 5;

const fmtBRL = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmado")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Paga</span>;
  if (status === "pendente")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pendente</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Cancelada</span>;
}

function TipoBadge({ recorrente }: { recorrente?: boolean }) {
  return recorrente
    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Recorrente</span>
    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Variável</span>;
}

export default function Balanco() {
  // Nova Conta
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [recorrenteForm, setRecorrenteForm] = useState(false);
  const [statusForm, setStatusForm] = useState<"confirmado" | "pendente">("confirmado");

  // Editar
  const [openEdit, setOpenEdit] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);
  const [editSalvando, setEditSalvando] = useState(false);

  // Excluir
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "saida">("todos");

  const hoje = new Date();
  const [mesFiltro, setMesFiltro] = useState<string>(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  );

  const queryClient = useQueryClient();

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["fluxo-caixa"],
    queryFn: () => fluxoService.getAll(),
    staleTime: STALE,
  });

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
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const transacoesDoMes = useMemo(() => {
    if (mesFiltro === "all") return transactions;
    return transactions.filter((t) => {
      const d = new Date(t.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === mesFiltro;
    });
  }, [transactions, mesFiltro]);

  const transacoesFiltradas = useMemo(() => {
    let r = [...transacoesDoMes];
    if (filtroTipo !== "todos") r = r.filter((t) => t.tipo === filtroTipo);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      r = r.filter(
        (t) =>
          t.descricao.toLowerCase().includes(q) ||
          (t.categoria || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [transacoesDoMes, filtroTipo, busca]);

  const agenda = useMemo(
    () =>
      transacoesDoMes
        .filter((t) => t.status === "pendente")
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    [transacoesDoMes]
  );

  const recorrencias = useMemo(
    () => transacoesDoMes.filter((t) => t.recorrente),
    [transacoesDoMes]
  );

  const kpis = useMemo(() => {
    const conf = transacoesDoMes.filter((t) => t.status === "confirmado");
    const pend = transacoesDoMes.filter((t) => t.status === "pendente");
    const entradasConf = conf.filter((t) => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
    const saidasConf = conf.filter((t) => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);
    const receitaPend = pend.filter((t) => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
    const saidasPend = pend.filter((t) => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);
    return {
      saldoCaixa: entradasConf - saidasConf,
      entradasConf,
      saidasConf,
      receitaPend,
      contasPend: pend.length,
      recorrentesPend: pend.filter((t) => t.recorrente).length,
      totalPend: receitaPend + saidasPend,
      contasPagas: conf.length,
      saldoProjetado: entradasConf - saidasConf + receitaPend - saidasPend,
    };
  }, [transacoesDoMes]);

  const barData = useMemo(() => {
    if (mesFiltro === "all") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
        const ano = d.getFullYear();
        const mes = d.getMonth();
        let receita = 0; let despesa = 0;
        transactions.forEach((t) => {
          if (t.status !== "confirmado") return;
          const td = new Date(t.data);
          if (td.getFullYear() === ano && td.getMonth() === mes) {
            if (t.tipo === "entrada") receita += Number(t.valor);
            else despesa += Number(t.valor);
          }
        });
        return { mes: MESES[mes], Receita: receita, Despesa: despesa };
      });
    }
    const semanas = [
      { mes: "Sem 1", Receita: 0, Despesa: 0 },
      { mes: "Sem 2", Receita: 0, Despesa: 0 },
      { mes: "Sem 3", Receita: 0, Despesa: 0 },
      { mes: "Sem 4", Receita: 0, Despesa: 0 },
    ];
    transacoesDoMes.filter((t) => t.status === "confirmado").forEach((t) => {
      const idx = Math.min(Math.floor((new Date(t.data).getDate() - 1) / 7), 3);
      if (t.tipo === "entrada") semanas[idx].Receita += Number(t.valor);
      else semanas[idx].Despesa += Number(t.valor);
    });
    return semanas;
  }, [transactions, transacoesDoMes, mesFiltro]);

  const pieData = useMemo(() => {
    const grupos: Record<string, number> = {};
    transacoesDoMes
      .filter((t) => t.tipo === "entrada" && t.status === "confirmado")
      .forEach((t) => {
        const cat = t.categoria || "Sem categoria";
        grupos[cat] = (grupos[cat] || 0) + Number(t.valor);
      });
    return Object.entries(grupos)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [transacoesDoMes]);

  function formatarMesLabel(key: string) {
    if (key === "all") return "Todos os meses";
    const [ano, mes] = key.split("-");
    return `${MESES_FULL[parseInt(mes) - 1]} ${ano}`;
  }

  function getMesRange(key: string) {
    if (key === "all") return "Todos os períodos";
    const [ano, mes] = key.split("-");
    const lastDay = new Date(parseInt(ano), parseInt(mes), 0).getDate();
    return `01/${mes}/${ano} – ${lastDay}/${mes}/${ano}`;
  }

  async function salvar() {
    if (!descricao || !valor || !categoria) { toast.error("Preencha todos os campos"); return; }
    setSalvando(true);
    try {
      await fluxoService.create({ descricao, valor: Number(valor), categoria, tipo, data, status: statusForm, recorrente: recorrenteForm });
      setDescricao(""); setValor(""); setCategoria(""); setTipo("entrada");
      setRecorrenteForm(false); setStatusForm("confirmado");
      setOpen(false); invalidar(); toast.success("Conta cadastrada!");
    } catch { toast.error("Erro ao cadastrar conta"); }
    finally { setSalvando(false); }
  }

  async function salvarEdicao() {
    if (!editItem) return;
    setEditSalvando(true);
    try {
      await fluxoService.update(editItem.id, {
        descricao: editItem.descricao, valor: Number(editItem.valor),
        categoria: editItem.categoria, tipo: editItem.tipo,
        data: editItem.data, status: editItem.status, recorrente: editItem.recorrente,
      });
      setOpenEdit(false); setEditItem(null); invalidar(); toast.success("Conta atualizada!");
    } catch { toast.error("Erro ao atualizar conta"); }
    finally { setEditSalvando(false); }
  }

  async function marcarComoPaga(id: string) {
    try {
      await fluxoService.update(id, { status: "confirmado" });
      invalidar(); toast.success("Marcada como paga!");
    } catch { toast.error("Erro ao atualizar"); }
  }

  async function confirmarDelete() {
    if (!deleteId) return;
    setLoadingDelete(true);
    try {
      await fluxoService.delete(deleteId);
      setDeleteId(null); setOpenDelete(false); invalidar(); toast.success("Transação excluída");
    } catch { toast.error("Erro ao excluir transação"); }
    finally { setLoadingDelete(false); }
  }

  const tabelaAcoes = (t: Transaction) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { setEditItem(t); setOpenEdit(true); }}>Editar</DropdownMenuItem>
        {t.status === "pendente" && (
          <DropdownMenuItem className="text-green-600" onClick={() => marcarComoPaga(t.id)}>
            Marcar como paga
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="text-red-600" onClick={() => { setDeleteId(t.id); setOpenDelete(true); }}>
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

      {/* ── DESKTOP ── */}
      <main className="hidden md:block flex-1 ml-20 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
          <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm text-muted-foreground bg-white">
              <Calendar className="w-4 h-4" />
              <span>{getMesRange(mesFiltro)}</span>
            </div>
            <Select value={mesFiltro} onValueChange={setMesFiltro}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filtrar mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {mesesDisponiveis.map((key) => (
                  <SelectItem key={key} value={key}>{formatarMesLabel(key)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Nova Conta</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                <DialogHeader><DialogTitle>Nova Conta</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v) => { setTipo(v as any); setCategoria(""); }}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusForm} onValueChange={(v) => setStatusForm(v as any)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmado">Paga</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input className="rounded-xl" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Aluguel do escritório" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input className="rounded-xl" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
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
                  <div className="flex items-center gap-2">
                    <Switch id="recorrente" checked={recorrenteForm} onCheckedChange={setRecorrenteForm} />
                    <Label htmlFor="recorrente">Lançamento recorrente</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button className="rounded-xl" onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-orange-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Saldo de Caixa</span>
              </div>
              <p className={`text-xl font-bold ${kpis.saldoCaixa >= 0 ? "text-gray-900" : "text-red-600"}`}>{fmtBRL(kpis.saldoCaixa)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">↑ {fmtBRL(kpis.entradasConf)}</span>
                {" | "}
                <span className="text-red-500">↓ {fmtBRL(kpis.saidasConf)}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Receita Pendente</span>
              </div>
              <p className="text-xl font-bold text-teal-600">{fmtBRL(kpis.receitaPend)}</p>
              <p className="text-xs text-muted-foreground mt-1">A receber (Comissões)</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contas Pendentes</span>
              </div>
              <p className="text-xl font-bold text-yellow-600">{fmtBRL(kpis.totalPend)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.contasPend} contas | {kpis.recorrentesPend} recorrentes
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contas Pagas</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{fmtBRL(kpis.entradasConf)}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpis.contasPagas} contas pagas</p>
            </CardContent>
          </Card>

        </div>

        {/* Tabs */}
        <Tabs defaultValue="lancamentos">
          <TabsList className="mb-6">
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="agenda">Agenda de Vencimentos</TabsTrigger>
            <TabsTrigger value="recorrencias">Recorrências</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* ── Lançamentos ── */}
          <TabsContent value="lancamentos">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 rounded-xl"
                  placeholder="Buscar por descrição ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {(["todos","entrada","saida"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    className="rounded-full"
                    variant={filtroTipo === f ? "default" : "outline"}
                    onClick={() => setFiltroTipo(f)}
                  >
                    {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : "Saídas"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        Nenhuma transação neste período.
                      </TableCell>
                    </TableRow>
                  ) : transacoesFiltradas.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/20">
                      <TableCell>
                        <p className="font-medium text-sm">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">{t.categoria ? (CATEGORIA_GRUPO[t.categoria] ?? "") : ""}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{t.categoria || "—"}</p>
                      </TableCell>
                      <TableCell><TipoBadge recorrente={t.recorrente} /></TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold text-sm ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {t.tipo === "entrada" ? "+" : "-"} {fmtBRL(Number(t.valor))}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(t.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-medium ${t.status === "confirmado" ? "text-green-600" : "text-muted-foreground"}`}>
                          {t.status === "confirmado" ? fmtBRL(Number(t.valor)) : "R$ 0,00"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{tabelaAcoes(t)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Agenda de Vencimentos ── */}
          <TabsContent value="agenda">
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agenda.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Nenhuma conta pendente neste período.
                      </TableCell>
                    </TableRow>
                  ) : agenda.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/20">
                      <TableCell>
                        <p className="font-medium text-sm">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">{t.categoria ? (CATEGORIA_GRUPO[t.categoria] ?? "") : ""}</p>
                      </TableCell>
                      <TableCell className="text-sm">{t.categoria || "—"}</TableCell>
                      <TableCell><TipoBadge recorrente={t.recorrente} /></TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold text-sm ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {t.tipo === "entrada" ? "+" : "-"} {fmtBRL(Number(t.valor))}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(t.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right">{tabelaAcoes(t)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Recorrências ── */}
          <TabsContent value="recorrencias">
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Última data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recorrencias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Nenhum lançamento recorrente neste período.
                      </TableCell>
                    </TableRow>
                  ) : recorrencias.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <p className="font-medium text-sm">{t.descricao}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{t.categoria || "—"}</p>
                        <p className="text-xs text-muted-foreground">{t.categoria ? (CATEGORIA_GRUPO[t.categoria] ?? "") : ""}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold text-sm ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {t.tipo === "entrada" ? "+" : "-"} {fmtBRL(Number(t.valor))}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(t.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right">{tabelaAcoes(t)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Relatórios ── */}
          <TabsContent value="relatorios">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <p className="text-base font-semibold mb-4">
                    Receita vs Despesa
                    {mesFiltro !== "all" && <span className="text-muted-foreground font-normal text-sm ml-2">— {formatarMesLabel(mesFiltro)}</span>}
                  </p>
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
                <CardContent className="p-6">
                  <p className="text-base font-semibold mb-4">
                    Receitas por Categoria
                    {mesFiltro !== "all" && <span className="text-muted-foreground font-normal text-sm ml-2">— {formatarMesLabel(mesFiltro)}</span>}
                  </p>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number, name: string) => [`R$ ${v.toLocaleString("pt-BR")}`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full max-h-40 overflow-y-auto mt-2 space-y-1 pr-1">
                        {pieData.map((entry, i) => {
                          const total = pieData.reduce((acc, d) => acc + d.value, 0);
                          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                          return (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
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
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm py-10 text-center">Sem receitas confirmadas neste período.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── MOBILE ── */}
      <main className="md:hidden flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
              <p className="text-muted-foreground text-sm">{getMesRange(mesFiltro)}</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 rounded-xl"><Plus className="w-4 h-4" /><span>Nova</span></Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                <DialogHeader><DialogTitle>Nova Conta</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v) => { setTipo(v as any); setCategoria(""); }}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <Select value={statusForm} onValueChange={(v) => setStatusForm(v as any)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmado">Paga</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição</Label>
                    <Input className="rounded-xl" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Valor (R$)</Label>
                      <Input className="rounded-xl" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Data</Label>
                      <Input className="rounded-xl" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                  <div className="flex items-center gap-2">
                    <Switch id="recorrente-m" checked={recorrenteForm} onCheckedChange={setRecorrenteForm} />
                    <Label htmlFor="recorrente-m">Lançamento recorrente</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button className="rounded-xl" onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
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

          {/* Mobile KPI grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border bg-white p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                  <Wallet className="w-2.5 h-2.5 text-orange-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Saldo</p>
              </div>
              <p className={`text-base font-bold ${kpis.saldoCaixa >= 0 ? "text-gray-900" : "text-red-600"}`}>{fmtBRL(kpis.saldoCaixa)}</p>
            </div>
            <div className="rounded-2xl border bg-white p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-2.5 h-2.5 text-blue-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Projetado</p>
              </div>
              <p className={`text-base font-bold ${kpis.saldoProjetado >= 0 ? "text-blue-600" : "text-red-600"}`}>{fmtBRL(kpis.saldoProjetado)}</p>
            </div>
            <div className="rounded-2xl border bg-white p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUp className="w-3 h-3 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground">Entradas</p>
              </div>
              <p className="text-base font-bold text-green-700">{fmtBRL(kpis.entradasConf)}</p>
            </div>
            <div className="rounded-2xl border bg-white p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDown className="w-3 h-3 text-red-500" />
                <p className="text-xs font-medium text-muted-foreground">Saídas</p>
              </div>
              <p className="text-base font-bold text-red-600">{fmtBRL(kpis.saidasConf)}</p>
            </div>
          </div>

          {/* Mobile transactions list */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 rounded-xl" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>

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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground">{t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StatusBadge status={t.status} />
                      <TipoBadge recorrente={t.recorrente} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`font-bold text-sm ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                      {t.tipo === "entrada" ? "+" : "-"} {fmtBRL(Number(t.valor))}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditItem(t); setOpenEdit(true); }}>Editar</DropdownMenuItem>
                        {t.status === "pendente" && (
                          <DropdownMenuItem className="text-green-600" onClick={() => marcarComoPaga(t.id)}>Marcar como paga</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600" onClick={() => { setDeleteId(t.id); setOpenDelete(true); }}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Modal Editar ── */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Editar Conta</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={editItem.tipo} onValueChange={(v) => setEditItem({ ...editItem, tipo: v as any, categoria: "" })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editItem.status} onValueChange={(v) => setEditItem({ ...editItem, status: v as any })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmado">Paga</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="cancelado">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input className="rounded-xl" value={editItem.descricao} onChange={(e) => setEditItem({ ...editItem, descricao: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input className="rounded-xl" type="number" min="0" step="0.01" value={editItem.valor} onChange={(e) => setEditItem({ ...editItem, valor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input className="rounded-xl" type="date" value={editItem.data?.split("T")[0] ?? ""} onChange={(e) => setEditItem({ ...editItem, data: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={editItem.categoria ?? ""} onValueChange={(v) => setEditItem({ ...editItem, categoria: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                  <SelectContent>
                    {editItem.tipo === "entrada" && (<>
                      <SelectItem value="Comissão de venda">Comissão de venda</SelectItem>
                      <SelectItem value="Comissão de aluguel">Comissão de aluguel</SelectItem>
                      <SelectItem value="Aluguel recebido">Aluguel recebido</SelectItem>
                      <SelectItem value="Taxa administrativa">Taxa administrativa</SelectItem>
                      <SelectItem value="Outros recebimentos">Outros recebimentos</SelectItem>
                    </>)}
                    {editItem.tipo === "saida" && (<>
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
              <div className="flex items-center gap-2">
                <Switch id="recorrente-edit" checked={editItem.recorrente ?? false} onCheckedChange={(v) => setEditItem({ ...editItem, recorrente: v })} />
                <Label htmlFor="recorrente-edit">Lançamento recorrente</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={salvarEdicao} disabled={editSalvando}>{editSalvando ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Excluir ── */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
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
