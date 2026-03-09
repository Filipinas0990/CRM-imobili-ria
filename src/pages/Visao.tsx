import { useState, useMemo, useEffect } from "react";
import {
    DollarSign,
    TrendingUp,
    Clock,
    Receipt,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    LineChart, Line, Legend, ResponsiveContainer,
} from "recharts";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Transacao = {
    id: string;
    descricao: string;
    valor: number;
    tipo: "entrada" | "saida";
    categoria: string;
    data: string;
};

type DespesaFixa = {
    id: string;
    descricao: string;
    valor: number;
    categoria: string;
    diaVencimento: number;
    status: "ativa" | "inativa";
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MESES_FULL = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getMesAnterior(mes: string) {
    const [ano, m] = mes.split("-").map(Number);
    const novoMes = m === 1 ? 12 : m - 1;
    const novoAno = m === 1 ? ano - 1 : ano;
    return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

function formatMesLabel(key: string) {
    const [ano, mes] = key.split("-");
    return `${MESES_FULL[parseInt(mes) - 1]} ${ano}`;
}

function keyFromDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mapRowToDespesaFixa(r: Record<string, unknown>): DespesaFixa {
    return {
        id: String(r.id),
        descricao: String(r.descricao_depesas ?? ""),
        valor: Number(r.valor_despesas ?? 0),
        categoria: String(r.categoria_despesas ?? ""),
        diaVencimento: Number(r.dia_vencimento ?? 1),
        status: r.status_despesas === "inativa" ? "inativa" : "ativa",
    };
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Visao() {
    const hoje = new Date();
    const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

    const [mesSelecionado, setMesSelecionado] = useState(mesAtualKey);
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Carrega dados ──────────────────────────────────────────────────────────

    useEffect(() => {
        async function load() {
            setLoading(true);

            // Entradas e saídas variáveis
            const { data: transData } = await supabase
                .from("financeiro")
                .select("id, descricao, valor, tipo, categoria, data")
                .eq("status", "confirmado")
                .in("tipo", ["entrada", "saida"])
                .order("data", { ascending: false });

            // Despesas fixas
            const { data: fixasData } = await supabase
                .from("financeiro")
                .select(`id, descricao_depesas, valor_despesas, categoria_despesas,
                 dia_vencimento, status_despesas`)
                .eq("tipo", "financeiro");

            if (transData) setTransacoes(transData as Transacao[]);
            if (fixasData) setDespesasFixas(fixasData.map(mapRowToDespesaFixa));

            setLoading(false);
        }
        load();
    }, []);

    // ── Meses disponíveis no dropdown ─────────────────────────────────────────

    const mesesDisponiveis = useMemo(() => {
        const set = new Set<string>();
        set.add(mesAtualKey);
        transacoes.forEach((t) => set.add(keyFromDate(t.data)));
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [transacoes]);

    // ── Filtra transações pelo mês ────────────────────────────────────────────

    function transacoesDo(mes: string) {
        return transacoes.filter((t) => keyFromDate(t.data) === mes);
    }

    // ── Calcula balanço de um mês ─────────────────────────────────────────────

    function calcularBalanco(mes: string) {
        const trans = transacoesDo(mes);
        const fixasAtivas = despesasFixas.filter((d) => d.status === "ativa");

        const entradas = trans
            .filter((t) => t.tipo === "entrada")
            .reduce((acc, t) => acc + Number(t.valor), 0);

        const saidasVariaveis = trans
            .filter((t) => t.tipo === "saida")
            .reduce((acc, t) => acc + Number(t.valor), 0);

        const custoFixo = fixasAtivas.reduce((acc, d) => acc + d.valor, 0);
        const despesasTotais = saidasVariaveis + custoFixo;
        const lucroLiquido = entradas - despesasTotais;
        const percentualDespesas = entradas > 0 ? (despesasTotais / entradas) * 100 : 0;

        return { entradas, saidasVariaveis, custoFixo, despesasTotais, lucroLiquido, percentualDespesas };
    }

    const balanco = useMemo(() => calcularBalanco(mesSelecionado), [mesSelecionado, transacoes, despesasFixas]);
    const balancoAnterior = useMemo(() => calcularBalanco(getMesAnterior(mesSelecionado)), [mesSelecionado, transacoes, despesasFixas]);

    // ── Variação % entre meses ────────────────────────────────────────────────

    function variacao(atual: number, anterior: number) {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return ((atual - anterior) / anterior) * 100;
    }

    // ── Risco financeiro ──────────────────────────────────────────────────────

    const risco = balanco.percentualDespesas > 70 ? "alto" : balanco.percentualDespesas > 40 ? "moderado" : "saudável";
    const riscoColor = risco === "alto" ? "text-red-500" : risco === "moderado" ? "text-yellow-500" : "text-green-500";
    const riscoBg = risco === "alto" ? "bg-red-500/10" : risco === "moderado" ? "bg-yellow-500/10" : "bg-green-500/10";

    // ── Cards KPI ─────────────────────────────────────────────────────────────

    const cards = [
        {
            title: "Entradas",
            value: balanco.entradas,
            icon: TrendingUp,
            var: variacao(balanco.entradas, balancoAnterior.entradas),
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            title: "Despesas Fixas",
            value: balanco.custoFixo,
            icon: Receipt,
            var: variacao(balanco.custoFixo, balancoAnterior.custoFixo),
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            inverso: true,
        },
        {
            title: "Despesas Variáveis",
            value: balanco.saidasVariaveis,
            icon: DollarSign,
            var: variacao(balanco.saidasVariaveis, balancoAnterior.saidasVariaveis),
            color: "text-red-500",
            bg: "bg-red-500/10",
            inverso: true,
        },
        {
            title: "Despesas Totais",
            value: balanco.despesasTotais,
            icon: Wallet,
            var: variacao(balanco.despesasTotais, balancoAnterior.despesasTotais),
            color: "text-red-500",
            bg: "bg-red-500/10",
            inverso: true,
        },
        {
            title: "Lucro Líquido",
            value: balanco.lucroLiquido,
            icon: Target,
            var: variacao(balanco.lucroLiquido, balancoAnterior.lucroLiquido),
            color: balanco.lucroLiquido >= 0 ? "text-green-500" : "text-red-500",
            bg: balanco.lucroLiquido >= 0 ? "bg-green-500/10" : "bg-red-500/10",
        },
    ];

    // ── Dados para gráfico de barras ──────────────────────────────────────────

    const barData = [
        { name: "Entradas", valor: balanco.entradas, fill: "#22c55e" },
        { name: "Fixas", valor: balanco.custoFixo, fill: "#eab308" },
        { name: "Variáveis", valor: balanco.saidasVariaveis, fill: "#ef4444" },
        { name: "Lucro", valor: Math.max(0, balanco.lucroLiquido), fill: "#3b82f6" },
    ];

    // ── Dados para gráfico comparativo ───────────────────────────────────────

    const comparativoData = [
        { metrica: "Entradas", mesAtual: balanco.entradas, mesAnterior: balancoAnterior.entradas },
        { metrica: "Fixas", mesAtual: balanco.custoFixo, mesAnterior: balancoAnterior.custoFixo },
        { metrica: "Variáveis", mesAtual: balanco.saidasVariaveis, mesAnterior: balancoAnterior.saidasVariaveis },
        { metrica: "Lucro", mesAtual: balanco.lucroLiquido, mesAnterior: balancoAnterior.lucroLiquido },
    ];

    // ── Transações do mês selecionado ─────────────────────────────────────────

    const transacoesMes = useMemo(() => transacoesDo(mesSelecionado), [mesSelecionado, transacoes]);
    const fixasAtivas = despesasFixas.filter((d) => d.status === "ativa");

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 ml-20 p-8 space-y-8 overflow-y-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Balanço Mensal</h1>
                        <p className="text-muted-foreground mt-1">Visão financeira completa do mês</p>
                    </div>
                    <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {mesesDisponiveis.map((m) => (
                                <SelectItem key={m} value={m}>{formatMesLabel(m)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {cards.map((card) => {
                        const isPositive = card.inverso ? card.var <= 0 : card.var >= 0;
                        return (
                            <Card key={card.title}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                        <div className={cn("p-2 rounded-lg", card.bg)}>
                                            <card.icon className={cn("w-4 h-4", card.color)} />
                                        </div>
                                    </div>
                                    <p className={cn("text-xl font-bold", card.color)}>
                                        {formatCurrency(card.value)}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        {isPositive
                                            ? <ArrowUpRight className="w-3 h-3 text-green-500" />
                                            : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                                        <span className={cn("text-xs font-medium", isPositive ? "text-green-500" : "text-red-500")}>
                                            {Math.abs(card.var).toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-muted-foreground">vs mês anterior</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Risco Operacional */}
                <Card className="border-dashed border-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Saúde Operacional
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Despesas Fixas</p>
                                <p className="text-lg font-bold text-yellow-500">{formatCurrency(balanco.custoFixo)}</p>
                                <p className="text-xs text-muted-foreground">{fixasAtivas.length} itens ativos</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Despesas Variáveis</p>
                                <p className="text-lg font-bold text-red-500">{formatCurrency(balanco.saidasVariaveis)}</p>
                                <p className="text-xs text-muted-foreground">{transacoesMes.filter(t => t.tipo === "saida").length} lançamentos</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">% Despesas sobre Receita</p>
                                <p className={cn("text-lg font-bold", riscoColor)}>
                                    {balanco.percentualDespesas.toFixed(1)}%
                                </p>
                                <Progress value={Math.min(balanco.percentualDespesas, 100)} className="h-2 mt-1" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={cn("w-4 h-4", riscoColor)} />
                                    <p className="text-xs text-muted-foreground">Risco Financeiro</p>
                                </div>
                                <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-bold capitalize", riscoBg, riscoColor)}>
                                    {risco}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Margem: {(100 - balanco.percentualDespesas).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resumo do Mês</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={barData} barCategoryGap="35%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                                        {barData.map((entry, i) => (
                                            <rect key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Comparativo com Mês Anterior</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={comparativoData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="metrica" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Line type="monotone" dataKey="mesAtual" stroke="#22c55e" strokeWidth={2}
                                        dot={{ r: 5 }} name={formatMesLabel(mesSelecionado)} />
                                    <Line type="monotone" dataKey="mesAnterior" stroke="#94a3b8" strokeWidth={2}
                                        strokeDasharray="5 5" dot={{ r: 5 }} name={formatMesLabel(getMesAnterior(mesSelecionado))} />
                                    <Legend />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabelas de detalhe */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Entradas do mês */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Entradas do Mês</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {transacoesMes.filter((t) => t.tipo === "entrada").length > 0 ? (
                                    transacoesMes
                                        .filter((t) => t.tipo === "entrada")
                                        .map((t) => (
                                            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div>
                                                    <p className="text-sm font-medium">{t.descricao}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.categoria} • {new Date(t.data).toLocaleDateString("pt-BR")}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-bold text-green-500">
                                                    +{formatCurrency(Number(t.valor))}
                                                </span>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma entrada neste mês</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Despesas do mês */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Despesas do Mês</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-80 overflow-y-auto">

                                {/* Fixas */}
                                {fixasAtivas.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-2">
                                            Fixas (recorrentes)
                                        </p>
                                        {fixasAtivas.map((d) => (
                                            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 mb-2">
                                                <div>
                                                    <p className="text-sm font-medium">{d.descricao}</p>
                                                    <p className="text-xs text-muted-foreground">{d.categoria} • Venc. dia {d.diaVencimento}</p>
                                                </div>
                                                <span className="text-sm font-bold text-yellow-500">-{formatCurrency(d.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Variáveis */}
                                {transacoesMes.filter((t) => t.tipo === "saida").length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
                                            Variáveis
                                        </p>
                                        {transacoesMes
                                            .filter((t) => t.tipo === "saida")
                                            .map((t) => (
                                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-2">
                                                    <div>
                                                        <p className="text-sm font-medium">{t.descricao}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t.categoria} • {new Date(t.data).toLocaleDateString("pt-BR")}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm font-bold text-red-500">-{formatCurrency(Number(t.valor))}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {fixasAtivas.length === 0 && transacoesMes.filter((t) => t.tipo === "saida").length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa neste mês</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}