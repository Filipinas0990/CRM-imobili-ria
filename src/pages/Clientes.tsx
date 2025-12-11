// src/pages/Clientes.tsx

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Mail, Phone, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { getClientes } from "@/integrations/supabase/clientes/getClientes";
import { createCliente } from "@/integrations/supabase/clientes/createCliente";
import { useNavigate } from "react-router-dom";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [modalNovoCliente, setModalNovoCliente] = useState(false);

  // FORMULÁRIO AGORA TEM O CAMPO COMPRA
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    compra: "", // ADICIONADO
  });

  const carregarClientes = async () => {
    try {
      setLoading(true);

      const { data } = await getClientes();
      setClientes(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const lista = Array.isArray(clientes) ? clientes : [];

  const clientesFiltrados = lista.filter((c) =>
    c.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  // =============================
  // CRIAR NOVO CLIENTE (ATUALIZADO)
  // =============================
  const salvarNovoCliente = async () => {
    if (!form.nome || !form.email) {
      alert("Preencha nome e e-mail!");
      return;
    }

    try {
      await createCliente({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        compra: form.compra, // NOVO
      });

      setModalNovoCliente(false);

      // limpa form
      setForm({ nome: "", email: "", telefone: "", compra: "" });

      // recarregar lista
      carregarClientes();

    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      alert("Erro ao cadastrar cliente.");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie sua base de clientes
              </p>
            </div>

            <Button className="gap-2" onClick={() => setModalNovoCliente(true)}>
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>

          {/* LISTAGEM */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar clientes..."
                      className="pl-10"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>

                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">

                {loading && (
                  <p className="text-sm text-muted-foreground">
                    Carregando clientes...
                  </p>
                )}

                {!loading && clientesFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </p>
                )}

                {!loading &&
                  clientesFiltrados.map((client) => (
                    <div
                      key={client.id}
                      className="p-5 rounded-xl border border-border hover:bg-accent/40 transition-colors flex justify-between items-center"
                    >
                      <div className="flex gap-4 items-start">

                        {/* AVATAR */}
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl font-semibold text-primary">
                            {client.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">

                          {/* NOME + STATUS */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {client.nome}
                            </h3>

                            <Badge variant="default" className="mt-1 bg-green-700 text-white">
                              {client.status || "Cliente Ativo"}
                            </Badge>
                          </div>

                          {/* EMAIL / TELEFONE / COMPRAS / COMPRA */}
                          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">

                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{client.email}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{client.telefone}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4" />
                              <span>{client.compra || "Sem compra"}</span>
                            </div>

                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => navigate(`/dashboard/clientes/${client.id}`)}
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* MODAL DE NOVO CLIENTE */}
      <Dialog open={modalNovoCliente} onOpenChange={setModalNovoCliente}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <Input
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <Input
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />

            {/* NOVO CAMPO: COMPRA */}
            <Input
              placeholder="Compra (Ex: Casa 403, Lote 12, Terreno B05...)"
              value={form.compra}
              onChange={(e) => setForm({ ...form, compra: e.target.value })}
            />

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovoCliente(false)}>
              Cancelar
            </Button>

            <Button onClick={salvarNovoCliente}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;
