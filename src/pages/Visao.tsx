{/* import { useState, useMemo } from "react";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DespesaFixa } from "./DespesasFixas";

// Mock data por mês
const vendasPorMes: Record<string, Array<{
    imovel: string;
    valor: number;
    comissaoPercent: number;
    status: "fechado" | "em_andamento";
    comissaoStatus: "recebido" | "pendente";
    dataFechamento: string;
    dataRecebimento?: string;
}>> = {
    "2026-02": [
        { imovel: "Apt 301 - Ed. Aurora", valor: 450000, comissaoPercent: 6, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2026-02-05", dataRecebimento: "2026-02-15" },
        { imovel: "Casa Jardim Europa", valor: 780000, comissaoPercent: 6, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2026-02-10", dataRecebimento: "2026-02-20" },
        { imovel: "Sala Comercial 12", valor: 3500, comissaoPercent: 10, status: "fechado", comissaoStatus: "pendente", dataFechamento: "2026-02-12" },
        { imovel: "Apt 502 - Ed. Sol", valor: 520000, comissaoPercent: 6, status: "fechado", comissaoStatus: "pendente", dataFechamento: "2026-02-18" },
        { imovel: "Cobertura Premium", valor: 1200000, comissaoPercent: 6, status: "em_andamento", comissaoStatus: "pendente", dataFechamento: "2026-02-22" },
    ],
    "2026-01": [
        { imovel: "Apt 101 - Ed. Brisa", valor: 380000, comissaoPercent: 6, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2026-01-08", dataRecebimento: "2026-01-18" },
        { imovel: "Casa Vila Nova", valor: 620000, comissaoPercent: 6, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2026-01-15", dataRecebimento: "2026-01-25" },
        { imovel: "Loja Centro", valor: 4200, comissaoPercent: 10, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2026-01-20", dataRecebimento: "2026-01-30" },
    ],
    "2025-12": [
        { imovel: "Apt 201 - Ed. Monte", valor: 410000, comissaoPercent: 6, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2025-12-05", dataRecebimento: "2025-12-15" },
        { imovel: "Terreno Alphaville", valor: 350000, comissaoPercent: 6, status: "fechado", comissaoStatus: "recebido", dataFechamento: "2025-12-12", dataRecebimento: "2025-12-22" },
    ],
};

const despesasVariaveisPorMes: Record<string, Array<{
    descricao: string;
    valor: number;
    tipo: "profissional" | "pessoal";
    data: string;
}>> = {
    "2026-02": [
        { descricao: "Combustível visitas", valor: 850, tipo: "profissional", data: "2026-02-05" },
        { descricao: "Anúncios portais", valor: 1200, tipo: "profissional", data: "2026-02-10" },
        { descricao: "Fotos profissionais", valor: 600, tipo: "profissional", data: "2026-02-14" },
    ],
    "2026-01": [
        { descricao: "Combustível visitas", valor: 720, tipo: "profissional", data: "2026-01-05" },
        { descricao: "Anúncios portais", valor: 1200, tipo: "profissional", data: "2026-01-10" },
    ],
    "2025-12": [
        { descricao: "Combustível visitas", valor: 680, tipo: "profissional", data: "2025-12-05" },
        { descricao: "Anúncios portais", valor: 1200, tipo: "profissional", data: "2025-12-10" },
    ],
};

const meses = [
    { value: "2026-02", label: "Fevereiro 2026" },
    { value: "2026-01", label: "Janeiro 2026" },
    { value: "2025-12", label: "Dezembro 2025" },
    { value: "2025-11", label: "Novembro 2025" },
];

function calcularBalanco(mes: string) {
    const vendas = vendasPorMes[mes] || [];
    const despesasVar = despesasVariaveisPorMes[mes] || [];
    const custoFixo = DespesaFixa();

    const vendasFechadas = vendas.filter((v) => v.status === "fechado");

    const comissaoPrevista = vendasFechadas.reduce(
        (acc, v) => acc + v.valor * (v.comissaoPercent / 100),
        0
    );

    const comissaoRecebida = vendasFechadas
        .filter((v) => v.comissaoStatus === "recebido" || v.dataRecebimento)
        .reduce((acc, v) => acc + v.valor * (v.comissaoPercent / 100), 0);

    const comissaoAReceber = comissaoPrevista - comissaoRecebida;

    const despesasVariaveis = despesasVar
        .filter((d) => d.tipo === "profissional")
        .reduce((acc, d) => acc + d.valor, 0);

    const despesasTotais = despesasVariaveis + custoFixo;
    const lucroLiquido = comissaoRecebida - despesasTotais;
    const percentualDespesas = comissaoRecebida > 0 ? (custoFixo / comissaoRecebida) * 100 : 0;

    return {
        comissaoPrevista,
        comissaoRecebida,
        comissaoAReceber,
        despesasVariaveis,
        custoFixo,
        despesasTotais,
        lucroLiquido,
        percentualDespesas,
    };
}

const chartConfig = {
    recebida: { label: "Recebida", color: "hsl(var(--success))" },
    despesas: { label: "Despesas", color: "hsl(var(--destructive))" },
    lucro: { label: "Lucro", color: "hsl(var(--primary))" },
    mesAtual: { label: "Mês Atual", color: "hsl(var(--primary))" },
    mesAnterior: { label: "Mês Anterior", color: "hsl(var(--muted-foreground))" },
};

function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getMesAnterior(mes: string) {
    const [ano, m] = mes.split("-").map(Number);
    const novoMes = m === 1 ? 12 : m - 1;
    const novoAno = m === 1 ? ano - 1 : ano;
    return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

export default function BalancoMensal() {
    const [mesSelecionado, setMesSelecionado] = useState("2026-02");

    const balanco = useMemo(() => calcularBalanco(mesSelecionado), [mesSelecionado]);
    const mesAnteriorKey = getMesAnterior(mesSelecionado);
    const balancoAnterior = useMemo(() => calcularBalanco(mesAnteriorKey), [mesAnteriorKey]);
    const despesasFixasAtivas = getDespesasFixasAtivas();

    const variacao = (atual: number, anterior: number) => {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return ((atual - anterior) / anterior) * 100;
    };

    const risco =
        balanco.percentualDespesas > 70 ? "alto" : balanco.percentualDespesas > 40 ? "moderado" : "saudável";
    const riscoColor =
        risco === "alto" ? "text-destructive" : risco === "moderado" ? "text-warning" : "text-success";
    const riscoBg =
        risco === "alto" ? "bg-destructive/10" : risco === "moderado" ? "bg-warning/10" : "bg-success/10";

    const barData = [
        { name: "Recebida", valor: balanco.comissaoRecebida, fill: "hsl(var(--success))" },
        { name: "Fixas", valor: balanco.custoFixo, fill: "hsl(var(--warning))" },
        { name: "Variáveis", valor: balanco.despesasVariaveis, fill: "hsl(var(--destructive))" },
        { name: "Lucro", valor: Math.max(0, balanco.lucroLiquido), fill: "hsl(var(--primary))" },
    ];

    const comparativoData = [
        { metrica: "Prevista", mesAtual: balanco.comissaoPrevista, mesAnterior: balancoAnterior.comissaoPrevista },
        { metrica: "Recebida", mesAtual: balanco.comissaoRecebida, mesAnterior: balancoAnterior.comissaoRecebida },
        { metrica: "Despesas", mesAtual: balanco.despesasTotais, mesAnterior: balancoAnterior.despesasTotais },
        { metrica: "Lucro", mesAtual: balanco.lucroLiquido, mesAnterior: balancoAnterior.lucroLiquido },
    ];

    const cards = [
        {
            title: "Comissão Prevista",
            value: balanco.comissaoPrevista,
            icon: TrendingUp,
            variacao: variacao(balanco.comissaoPrevista, balancoAnterior.comissaoPrevista),
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            title: "Comissão Recebida",
            value: balanco.comissaoRecebida,
            icon: DollarSign,
            variacao: variacao(balanco.comissaoRecebida, balancoAnterior.comissaoRecebida),
            color: "text-success",
            bgColor: "bg-success/10",
        },
        {
            title: "A Receber",
            value: balanco.comissaoAReceber,
            icon: Clock,
            variacao: variacao(balanco.comissaoAReceber, balancoAnterior.comissaoAReceber),
            color: "text-warning",
            bgColor: "bg-warning/10",
        },
        {
            title: "Despesas Totais",
            value: balanco.despesasTotais,
            icon: Receipt,
            variacao: variacao(balanco.despesasTotais, balancoAnterior.despesasTotais),
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            inverso: true,
        },
        {
            title: "Lucro Líquido",
            value: balanco.lucroLiquido,
            icon: Wallet,
            variacao: variacao(balanco.lucroLiquido, balancoAnterior.lucroLiquido),
            color: balanco.lucroLiquido >= 0 ? "text-success" : "text-destructive",
            bgColor: balanco.lucroLiquido >= 0 ? "bg-success/10" : "bg-destructive/10",
        },
    ];
    */}

{/* 

    return (
        <div className="space-y-6">
            {/* Header 
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Balanço Mensal</h1>
                    <p className="text-muted-foreground">Visão financeira completa do mês</p>
                </div>
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {meses.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Cards 
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {cards.map((card) => {
                    const isPositive = card.inverso ? card.variacao <= 0 : card.variacao >= 0;
                    return (
                        <Card key={card.title} className="shadow-card hover:shadow-card-hover transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                    <div className={cn("p-2 rounded-lg", card.bgColor)}>
                                        <card.icon className={cn("w-4 h-4", card.color)} />
                                    </div>
                                </div>
                                <p className={cn("text-xl font-bold", card.color)}>
                                    {formatCurrency(card.value)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    {isPositive ? (
                                        <ArrowUpRight className="w-3 h-3 text-success" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3 text-destructive" />
                                    )}
                                    <span className={cn("text-xs font-medium", isPositive ? "text-success" : "text-destructive")}>
                                        {Math.abs(card.variacao).toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">vs mês anterior</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            

            {/* Custo Operacional Fixo - NEW INTEGRATION *
            <Card className="border-2 border-dashed border-warning/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-warning" />
                        Custo Operacional Fixo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Despesas Fixas</p>
                            <p className="text-lg font-bold text-warning">{formatCurrency(balanco.custoFixo)}</p>
                            <p className="text-xs text-muted-foreground">{despesasFixasAtivas.length} itens ativos</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Despesas Variáveis</p>
                            <p className="text-lg font-bold text-destructive">{formatCurrency(balanco.despesasVariaveis)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">% Fixas sobre Receita</p>
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
                                Margem bruta: {(100 - balanco.percentualDespesas).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            */}

{/*

            {/* Charts *
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Resumo do Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                                <ChartTooltip
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                                />
                                <Bar dataKey="valor" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Comparativo com Mês Anterior</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <LineChart data={comparativoData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="metrica" className="text-xs" />
                                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                                <ChartTooltip
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                                />
                                <Line type="monotone" dataKey="mesAtual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 5 }} name="Mês Atual" />
                                <Line type="monotone" dataKey="mesAnterior" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 5 }} name="Mês Anterior" />
                                <Legend />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Tables *
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Vendas Fechadas no Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(vendasPorMes[mesSelecionado] || [])
                                .filter((v) => v.status === "fechado")
                                .map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{v.imovel}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Comissão: {formatCurrency(v.valor * (v.comissaoPercent / 100))}
                                            </p>
                                        </div>
                                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", v.comissaoStatus === "recebido" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                                            {v.comissaoStatus === "recebido" ? "Recebido" : "Pendente"}
                                        </span>
                                    </div>
                                ))}
                            {!(vendasPorMes[mesSelecionado] || []).filter((v) => v.status === "fechado").length && (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda fechada neste mês</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Despesas do Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {/* Despesas Fixas 
                            {despesasFixasAtivas.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">Fixas (recorrentes)</p>
                                    {despesasFixasAtivas.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{d.descricao}</p>
                                                <p className="text-xs text-muted-foreground">{d.categoria} • Venc. dia {d.diaVencimento}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-warning">-{formatCurrency(d.valor)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Despesas Variáveis 
                            {(despesasVariaveisPorMes[mesSelecionado] || []).filter((d) => d.tipo === "profissional").length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Variáveis</p>
                                    {(despesasVariaveisPorMes[mesSelecionado] || [])
                                        .filter((d) => d.tipo === "profissional")
                                        .map((d, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-2">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{d.descricao}</p>
                                                    <p className="text-xs text-muted-foreground">{d.data}</p>
                                                </div>
                                                <span className="text-sm font-semibold text-destructive">-{formatCurrency(d.valor)}</span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

    );
    */}


