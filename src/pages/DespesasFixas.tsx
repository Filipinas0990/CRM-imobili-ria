import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Receipt,
  TrendingDown,
  Target,
  DollarSign,
  Pause,
  Play,
  Trash2,
  Edit,
  AlertTriangle,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";

export type DespesaFixa = {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  diaVencimento: number;
  formaPagamento: string;
  status: "ativa" | "inativa";
  observacoes?: string;
  centroCusto?: string;
  contaVinculada?: string;
};

const formasPagamento = ["PIX", "Transferência", "Boleto", "Cartão de Crédito", "Débito em conta", "Dinheiro"];

const DEFAULT_CATEGORIAS = [
  "Aluguel", "Condomínio", "Energia", "Água", "Internet", "Salários",
  "Impostos", "Marketing", "Portais imobiliários", "Ferramentas / Sistemas", "Outros",
];

// Comissão média simulada baseada em histórico
const COMISSAO_MEDIA_POR_VENDA = 31200; // R$ 31.200 média

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--info))",
  "hsl(210, 60%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(30, 70%, 50%)",
  "hsl(160, 50%, 45%)",
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const emptyForm: {
  descricao: string;
  valor: string;
  categoria: string;
  diaVencimento: string;
  formaPagamento: string;
  status: "ativa" | "inativa";
  observacoes: string;
  centroCusto: string;
  contaVinculada: string;
} = {
  descricao: "",
  valor: "",
  categoria: "",
  diaVencimento: "",
  formaPagamento: "",
  status: "ativa",
  observacoes: "",
  centroCusto: "",
  contaVinculada: "",
};

function mapRowToDespesa(r: Record<string, unknown>): DespesaFixa {
  return {
    id: String(r.id),
    descricao: String(r.descricao ?? ""),
    valor: Number(r.valor ?? 0),
    categoria: String(r.categoria ?? ""),
    diaVencimento: Number(r.dia_vencimento ?? 1),
    formaPagamento: String(r.forma_pagamento ?? ""),
    status: (r.status === "inativa" ? "inativa" : "ativa") as "ativa" | "inativa",
    observacoes: r.observacoes != null ? String(r.observacoes) : undefined,
    centroCusto: r.centro_custo != null ? String(r.centro_custo) : undefined,
    contaVinculada: r.conta_vinculada != null ? String(r.conta_vinculada) : undefined,
  };
}

export default function DespesasFixas() {
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [userCategorias, setUserCategorias] = useState<string[]>([]);

  const categorias = useMemo(() => {
    const fromDespesas = [...new Set(despesas.map((d) => d.categoria).filter(Boolean))];
    return [...new Set([...DEFAULT_CATEGORIAS, ...fromDespesas, ...userCategorias])];
  }, [despesas, userCategorias]);

  async function loadDespesasFixas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("financeiro")
      .select("*")
      .order("dia_vencimento", { ascending: true });
    if (!error && data) {
      setDespesas(data.map(mapRowToDespesa));
    }
    setLoading(false);
  }

  const refresh = () => loadDespesasFixas();

  useEffect(() => {
    loadDespesasFixas();
  }, []);

  const custoFixoTotal = useMemo(
    () => despesas.filter((d) => d.status === "ativa").reduce((acc, d) => acc + d.valor, 0),
    [despesas]
  );

  const totalDespesas = despesas.length;
  const ativas = despesas.filter((d) => d.status === "ativa").length;
  const inativas = despesas.filter((d) => d.status === "inativa").length;

  const breakEven = COMISSAO_MEDIA_POR_VENDA > 0 ? Math.ceil(custoFixoTotal / COMISSAO_MEDIA_POR_VENDA) : 0;

  // Chart data: por categoria
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    despesas
      .filter((d) => d.status === "ativa")
      .forEach((d) => map.set(d.categoria, (map.get(d.categoria) || 0) + d.valor));
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [despesas]);

  const chartConfig = Object.fromEntries(
    porCategoria.map((c) => [c.name, { label: c.name, color: c.fill }])
  );

  // Filtros
  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      if (filtroCategoria !== "todas" && d.categoria !== filtroCategoria) return false;
      if (filtroStatus !== "todas" && d.status !== filtroStatus) return false;
      return true;
    });
  }, [despesas, filtroCategoria, filtroStatus]);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: DespesaFixa) => {
    setEditId(d.id);
    setForm({
      descricao: d.descricao,
      valor: String(d.valor),
      categoria: d.categoria,
      diaVencimento: String(d.diaVencimento),
      formaPagamento: d.formaPagamento,
      status: d.status,
      observacoes: d.observacoes || "",
      centroCusto: d.centroCusto || "",
      contaVinculada: d.contaVinculada || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor || !form.categoria || !form.diaVencimento || !form.formaPagamento) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const valor = parseFloat(form.valor);
    const dia = parseInt(form.diaVencimento);
    if (isNaN(valor) || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    if (isNaN(dia) || dia < 1 || dia > 31) {
      toast({ title: "Dia de vencimento deve ser entre 1 e 31", variant: "destructive" });
      return;
    }

    const row = {
      descricao: form.descricao.trim(),
      valor,
      categoria: form.categoria,
      dia_vencimento: dia,
      forma_pagamento: form.formaPagamento,
      status: form.status,
      observacoes: form.observacoes.trim() || null,
      centro_custo: form.centroCusto.trim() || null,
      conta_vinculada: form.contaVinculada.trim() || null,
    };

    if (editId) {
      const { error } = await supabase.from("despesas_fixas").update(row).eq("id", editId);
      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
        return;
      }
      toast({ title: "Despesa atualizada com sucesso!" });
    } else {
      const { error } = await supabase.from("despesas_fixas").insert([row]);
      if (error) {
        toast({ title: "Erro ao cadastrar", variant: "destructive" });
        return;
      }
      toast({ title: "Despesa cadastrada com sucesso!" });
    }
    setDialogOpen(false);
    refresh();
  };

  const handleToggleStatus = async (d: DespesaFixa) => {
    const newStatus = d.status === "ativa" ? "inativa" : "ativa";
    const { error } = await supabase.from("despesas_fixas").update({ status: newStatus }).eq("id", d.id);
    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
      return;
    }
    refresh();
    toast({ title: d.status === "ativa" ? "Despesa pausada" : "Despesa reativada" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("despesas_fixas").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    refresh();
    toast({ title: "Despesa removida" });
  };

  const handleAddCategoria = () => {
    if (novaCategoria.trim()) {
      setUserCategorias((prev) => [...prev, novaCategoria.trim()]);
      setForm({ ...form, categoria: novaCategoria.trim() });
      setNovaCategoria("");
      setShowNovaCategoria(false);
    }
  };

  // Indicador de risco
  const receita = 74150; // simulada
  const percentualDespesas = receita > 0 ? (custoFixoTotal / receita) * 100 : 0;
  const risco =
    percentualDespesas > 70 ? "alto" : percentualDespesas > 40 ? "moderado" : "saudável";
  const riscoColor =
    risco === "alto" ? "text-destructive" : risco === "moderado" ? "text-warning" : "text-success";
  const riscoBg =
    risco === "alto" ? "bg-destructive/10" : risco === "moderado" ? "bg-warning/10" : "bg-success/10";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-20 p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Despesas Fixas</h1>
            <p className="text-muted-foreground">
              Gerencie seus custos operacionais recorrentes
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="inativa">Inativas</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? "Editar Despesa" : "Nova Despesa Fixa"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Descrição *</Label>
                    <Input
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      placeholder="Ex: Portal ZAP Imóveis"
                      maxLength={100}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Valor (R$) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.valor}
                        onChange={(e) => setForm({ ...form, valor: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Dia Vencimento *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={form.diaVencimento}
                        onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })}
                        placeholder="1-31"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoria *</Label>
                    {!showNovaCategoria ? (
                      <div className="flex gap-2">
                        <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => setShowNovaCategoria(true)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={novaCategoria}
                          onChange={(e) => setNovaCategoria(e.target.value)}
                          placeholder="Nova categoria"
                          maxLength={50}
                        />
                        <Button size="sm" onClick={handleAddCategoria}>OK</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowNovaCategoria(false)}>✕</Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Forma de Pagamento *</Label>
                    <Select value={form.formaPagamento} onValueChange={(v) => setForm({ ...form, formaPagamento: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>Status</Label>
                    <Switch
                      checked={form.status === "ativa"}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, status: checked ? "ativa" : "inativa" })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.status === "ativa" ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Notas opcionais..."
                      maxLength={300}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Centro de Custo</Label>
                      <Input
                        value={form.centroCusto}
                        onChange={(e) => setForm({ ...form, centroCusto: e.target.value })}
                        placeholder="Opcional"
                        maxLength={50}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Conta Vinculada</Label>
                      <Input
                        value={form.contaVinculada}
                        onChange={(e) => setForm({ ...form, contaVinculada: e.target.value })}
                        placeholder="Opcional"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSave}>{editId ? "Salvar" : "Cadastrar"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        </div>


        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Custo Fixo Mensal</p>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Receipt className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <p className="text-xl font-bold text-destructive">{formatCurrency(custoFixoTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">{ativas} despesas ativas</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Break-even</p>
                <div className="p-2 rounded-lg bg-warning/10">
                  <Target className="w-4 h-4 text-warning" />
                </div>
              </div>
              <p className="text-xl font-bold text-warning">
                {breakEven} {breakEven === 1 ? "venda" : "vendas"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Comissão média: {formatCurrency(COMISSAO_MEDIA_POR_VENDA)}
              </p>
            </CardContent>
          </Card>


          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">% sobre Receita</p>
                <div className={cn("p-2 rounded-lg", riscoBg)}>
                  <TrendingDown className={cn("w-4 h-4", riscoColor)} />
                </div>
              </div>
              <p className={cn("text-xl font-bold", riscoColor)}>
                {percentualDespesas.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Margem bruta: {(100 - percentualDespesas).toFixed(1)}%
              </p>
            </CardContent>
          </Card>


          <Card className="shadow-card hover:shadow-card-hover transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Risco Financeiro</p>
                <div className={cn("p-2 rounded-lg", riscoBg)}>
                  <AlertTriangle className={cn("w-4 h-4", riscoColor)} />
                </div>
              </div>
              <p className={cn("text-xl font-bold capitalize", riscoColor)}>{risco}</p>
              <Progress
                value={Math.min(percentualDespesas, 100)}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </div>



        {/* Charts + List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-muted-foreground" />
                Por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {porCategoria.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <PieChart>
                    <Pie
                      data={porCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {porCategoria.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              )}
              <div className="space-y-2 mt-4">
                {porCategoria.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.fill }} />
                      <span className="text-muted-foreground truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>





          {/* Expense List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Despesas Cadastradas</CardTitle>
                <Badge variant="outline">
                  {despesasFiltradas.length} {despesasFiltradas.length === 1 ? "item" : "itens"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {despesasFiltradas.map((d) => (
                  <div
                    key={d.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all",
                      d.status === "ativa"
                        ? "bg-card hover:shadow-sm"
                        : "bg-muted/30 opacity-70"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{d.descricao}</p>
                        <Badge
                          variant={d.status === "ativa" ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {d.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{d.categoria}</span>
                        <span>•</span>
                        <span>Venc. dia {d.diaVencimento}</span>
                        <span>•</span>
                        <span>{d.formaPagamento}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm font-bold text-destructive whitespace-nowrap">
                        {formatCurrency(d.valor)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleStatus(d)}
                        title={d.status === "ativa" ? "Pausar" : "Reativar"}
                      >
                        {d.status === "ativa" ? (
                          <Pause className="w-4 h-4 text-warning" />
                        ) : (
                          <Play className="w-4 h-4 text-success" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(d)}
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(d.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {despesasFiltradas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {loading ? "Carregando..." : "Nenhuma despesa encontrada"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

    </div>



  );
}
