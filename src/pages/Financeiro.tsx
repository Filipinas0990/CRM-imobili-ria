import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Filter } from "lucide-react";

const transactions = [
  { id: 1, type: "entrada", value: 850000, description: "Venda – Apartamento Vila Mariana", date: "12/11/2025" },
  { id: 2, type: "entrada", value: 3500, description: "Comissão – Ana Costa", date: "11/11/2025" },
  { id: 3, type: "saida", value: 450, description: "Custo de anúncio", date: "09/11/2025" },
];

const Financeiro = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
              <p className="text-muted-foreground mt-2">
                Controle financeiro e comissões
              </p>
            </div>

            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>

          {/* Cards de Resumo */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  R$ 853.500
                </p>
                <p className="text-xs text-muted-foreground mt-1">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saídas</CardTitle>
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  R$ 450
                </p>
                <p className="text-xs text-muted-foreground mt-1">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                <Wallet className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  R$ 853.050
                </p>
                <p className="text-xs text-muted-foreground mt-1">Atualizado agora</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Transações */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transações Recentes</CardTitle>

                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.description}</p>
                      <p className="text-sm text-muted-foreground">{t.date}</p>
                    </div>

                    <p
                      className={`font-bold ${t.type === "entrada" ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {t.type === "entrada" ? "+" : "-"} R$ {t.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Financeiro;
