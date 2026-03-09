import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Wallet, Plus, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Transaction = {
  id: number;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  categoria: string;
  data: string;
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const PIE_COLORS = [
  "#22c55e", "#3b82f6", "#06b6d4", "#8b5cf6", "#a3e635",
  "#f97316", "#eab308", "#ec4899", "#6366f1", "#14b8a6", "#94a3b8",
];

export default function Balanco() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [senha, setSenha] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [data, setData] = useState("");

  const hoje = new Date();
  const [mesFiltro, setMesFiltro] = useState<string>(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    loadFinanceiro();
    setData(new Date().toISOString().split("T")[0]);
  }, []);

  async function loadFinanceiro() {
    const { data, error } = await supabase
      .from("financeiro")
      .select("id, descricao, valor, tipo, categoria, data")
      .eq("status", "confirmado")
      .in("tipo", ["entrada", "saida"])
      .order("data", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
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

  // Todas as transações filtradas pelo mês selecionado
  const transacoesFiltradas = useMemo(() => {
    if (mesFiltro === "all") return transactions;
    return transactions.filter((t) => {
      const d = new Date(t.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === mesFiltro;
    });
  }, [transactions, mesFiltro]);

  // Cards
  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    transacoesFiltradas.forEach((t) => {
      if (t.tipo === "entrada") entradas += Number(t.valor);
      if (t.tipo === "saida") saidas += Number(t.valor);
    });
    return { entradas, saidas, saldo: entradas - saidas };
  }, [transacoesFiltradas]);

  // Gráfico de barras — quando "all", mostra últimos 6 meses; quando filtrado, mostra os dias do mês
  const barData = useMemo(() => {
    if (mesFiltro === "all") {
      // Últimos 6 meses
      const meses: { mes: string; Receita: number; Despesa: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesLabel = MESES[d.getMonth()];
        const ano = d.getFullYear();
        const mes = d.getMonth();
        let receita = 0;
        let despesa = 0;
        transactions.forEach((t) => {
          const tDate = new Date(t.data);
          if (tDate.getFullYear() === ano && tDate.getMonth() === mes) {
            if (t.tipo === "entrada") receita += Number(t.valor);
            if (t.tipo === "saida") despesa += Number(t.valor);
          }
        });
        meses.push({ mes: mesLabel, Receita: receita, Despesa: despesa });
      }
      return meses;
    } else {
      // Agrupa por semana dentro do mês selecionado
      const [ano, mes] = mesFiltro.split("-").map(Number);
      const semanas: { mes: string; Receita: number; Despesa: number }[] = [
        { mes: "Sem 1", Receita: 0, Despesa: 0 },
        { mes: "Sem 2", Receita: 0, Despesa: 0 },
        { mes: "Sem 3", Receita: 0, Despesa: 0 },
        { mes: "Sem 4", Receita: 0, Despesa: 0 },
      ];
      transacoesFiltradas.forEach((t) => {
        const dia = new Date(t.data).getDate();
        const semIdx = Math.min(Math.floor((dia - 1) / 7), 3);
        if (t.tipo === "entrada") semanas[semIdx].Receita += Number(t.valor);
        if (t.tipo === "saida") semanas[semIdx].Despesa += Number(t.valor);
      });
      return semanas;
    }
  }, [transactions, transacoesFiltradas, mesFiltro]);

  // Gráfico de rosca — filtrado pelo mês
  const pieData = useMemo(() => {
    const grupos: Record<string, number> = {};
    transacoesFiltradas
      .filter((t) => t.tipo === "entrada")
      .forEach((t) => {
        const cat = t.categoria || "Sem categoria";
        if (!grupos[cat]) grupos[cat] = 0;
        grupos[cat] += Number(t.valor);
      });
    return Object.entries(grupos)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [transacoesFiltradas]);

  async function salvar() {
    if (!descricao || !valor || !categoria) return;
    const row = { descricao, valor: Number(valor), categoria, tipo, data, status: "confirmado" };
    const { error } = await supabase.from("financeiro").insert([row]);
    if (error) { console.log("ERRO SUPABASE:", error); return; }
    setDescricao("");
    setValor("");
    setCategoria("");
    setTipo("entrada");
    setOpen(false);
    loadFinanceiro();
  }

  async function confirmarDelete() {
    if (!deleteId || !senha) return;
    setLoadingDelete(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { alert("Usuário não autenticado"); setLoadingDelete(false); return; }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: senha });
    if (authError) { alert("Senha incorreta"); setLoadingDelete(false); return; }
    await supabase.from("financeiro").delete().eq("id", deleteId);
    setSenha("");
    setDeleteId(null);
    setOpenDelete(false);
    setLoadingDelete(false);
    loadFinanceiro();
  }

  function formatarMesLabel(key: string) {
    if (key === "all") return "Todos os meses";
    const [ano, mes] = key.split("-");
    return `${MESES_FULL[parseInt(mes) - 1]} ${ano}`;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-20 p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground mt-2">Controle financeiro e comissões</p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={mesFiltro} onValueChange={setMesFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {mesesDisponiveis.map((key) => (
                  <SelectItem key={key} value={key}>
                    {formatarMesLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                      <SelectContent>
                        {tipo === "entrada" && (
                          <>
                            <SelectItem value="Comissão de venda">Comissão de venda</SelectItem>
                            <SelectItem value="Comissão de aluguel">Comissão de aluguel</SelectItem>
                            <SelectItem value="Aluguel recebido">Aluguel recebido</SelectItem>
                            <SelectItem value="Taxa administrativa">Taxa administrativa</SelectItem>
                            <SelectItem value="Outros recebimentos">Outros recebimentos</SelectItem>
                          </>
                        )}
                        {tipo === "saida" && (
                          <>
                            <SelectItem value="Comissão corretor">Comissão corretor</SelectItem>
                            <SelectItem value="Anúncios / Marketing">Anúncios / Marketing</SelectItem>
                            <SelectItem value="Portais imobiliários">Portais imobiliários</SelectItem>
                            <SelectItem value="Salários">Salários</SelectItem>
                            <SelectItem value="Ferramentas / Sistemas">Ferramentas / Sistemas</SelectItem>
                            <SelectItem value="Impostos">Impostos</SelectItem>
                            <SelectItem value="Manutenção">Manutenção</SelectItem>
                            <SelectItem value="Outros custos">Outros custos</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input value={valor} onChange={(e) => setValor(e.target.value)} />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={salvar}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm">Entradas</CardTitle>
              <ArrowUp className="text-green-500" />
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              R$ {resumo.entradas.toLocaleString("pt-BR")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm">Saídas</CardTitle>
              <ArrowDown className="text-red-500" />
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              R$ {resumo.saidas.toLocaleString("pt-BR")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm">Saldo</CardTitle>
              <Wallet />
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              R$ {resumo.saldo.toLocaleString("pt-BR")}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Receita vs Despesa
                {mesFiltro !== "all" && (
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    — {formatarMesLabel(mesFiltro)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
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
                {mesFiltro !== "all" && (
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    — {formatarMesLabel(mesFiltro)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `R$ ${value.toLocaleString("pt-BR")}`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full max-h-40 overflow-y-auto mt-2 space-y-1 pr-1">
                    {pieData.map((entry, index) => {
                      const total = pieData.reduce((acc, d) => acc + d.value, 0);
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
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
                <p className="text-muted-foreground text-sm py-10">Sem receitas neste mês.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center border rounded-lg p-4 hover:bg-muted/40 transition"
              >
                <div>
                  <p className="font-medium">{t.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(t.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                    {t.tipo === "entrada" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR")}
                  </span>
                  <Button
                    size="icon"
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    onClick={() => { setDeleteId(t.id); setOpenDelete(true); }}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      {/* Modal Delete */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Digite sua senha para confirmar a exclusão desta transação.
            </p>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmarDelete} disabled={loadingDelete}>
                {loadingDelete ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}