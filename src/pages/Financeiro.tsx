import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Wallet, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export default function Financeiro() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [data, setData] = useState("");

  useEffect(() => {
    loadFinanceiro();
    setData(new Date().toISOString().split("T")[0]);
  }, []);

  async function loadFinanceiro() {
    const { data, error } = await supabase
      .from("financeiro")
      .select("*")
      .eq("status", "confirmado")
      .order("data", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  }

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    transactions.forEach((t) => {
      if (t.tipo === "entrada") entradas += Number(t.valor);
      if (t.tipo === "saida") saidas += Number(t.valor);
    });

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [transactions]);

  async function salvar() {
    if (!descricao || !valor || !categoria) return;

    await supabase.from("financeiro").insert([
      {
        descricao,
        valor: Number(valor),
        categoria,
        tipo,
        data,
        status: "confirmado",
      },
    ]);

    setDescricao("");
    setValor("");
    setCategoria("");
    setTipo("entrada");
    setOpen(false);
    loadFinanceiro();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

     <main className="flex-1 ml-20 p-8 space-y-8 overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground mt-2">
              Controle financeiro e comissões
            </p>
          </div>

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
                {/* Descrição */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>

                {/* Tipo + Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
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

                {/* Valor */}
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ex: 3500 ou 3.500,00"
                  />
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={salvar}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* Lista */}
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
                <span
                  className={`font-bold ${
                    t.tipo === "entrada" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.tipo === "entrada" ? "+" : "-"} R${" "}
                  {Number(t.valor).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
