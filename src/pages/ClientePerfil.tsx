// src/pages/ClientePerfil.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Mail, Phone, ShoppingBag, ArrowLeft, Calendar, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const ClientePerfil = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(true);

    const carregarCliente = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .eq("id", id)
            .single();

        if (error) console.error(error);

        setCliente(data);
        setLoading(false);
    };

    useEffect(() => {
        carregarCliente();
    }, [id]);

    if (loading || !cliente) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="p-10">Carregando...</main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-8 space-y-8">

                {/* VOLTAR */}
                {/* VOLTAR */}
                <Button variant="ghost" onClick={() => navigate("/dashboard/clientes")} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Button>

                {/* HEADER DO PERFIL */}
                <div className="flex items-start justify-between">

                    <div className="flex gap-6 items-center">

                        {/* AVATAR */}
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary">
                                {cliente.nome?.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">{cliente.nome}</h1>

                            <Badge className="bg-green-700 text-white">
                                {cliente.status || "Cliente Ativo"}
                            </Badge>

                            <div className="flex gap-5 text-muted-foreground mt-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {cliente.email}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {cliente.telefone}
                                </div>

                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    {cliente.compras ?? 0} compras
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button>Editar Cliente</Button>
                </div>

                {/* CARDS DE INFORMAÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Gerais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p><strong>Nome:</strong> {cliente.nome}</p>
                            <p><strong>Email:</strong> {cliente.email}</p>
                            <p><strong>Telefone:</strong> {cliente.telefone}</p>
                            <p><strong>Status:</strong> {cliente.status || "Cliente Ativo"}</p>
                            <p><strong>Compra:</strong> {cliente.compra || "Nenhuma compra registrada"}</p>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Próximos Contatos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">

                            <div className="flex gap-3 items-center">
                                <Calendar className="w-4 h-4" />
                                Nenhum contato agendado.
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Atividades</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">

                            <div className="flex gap-3 items-center">
                                <Clock className="w-4 h-4" />
                                Nenhuma atividade registrada.
                            </div>

                        </CardContent>
                    </Card>

                </div>

                {/* TIMELINE / HISTÓRICO */}
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico do Cliente</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-6">

                            {/* ITEM */}
                            <div className="flex gap-4">
                                <div className="w-3 h-3 rounded-full bg-primary mt-1"></div>
                                <div>
                                    <p className="font-semibold">Conta criada</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(cliente.criado_em).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* OUTROS EVENTOS (exemplo futuro) */}
                            <div className="text-muted-foreground text-sm">
                                Nenhum outro evento registrado.
                            </div>

                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
};

export default ClientePerfil;
