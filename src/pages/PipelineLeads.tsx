import { useState, useEffect } from "react";
import clsx from "clsx";

import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { updateLead } from "@/integrations/supabase/leads/updateLead";

const ETAPAS = [
    { id: "novo", title: "Leads", color: "border-blue-500 text-blue-600" },
    { id: "contato", title: "Em contato", color: "border-yellow-500 text-yellow-600" },
    { id: "Visista", title: "Visita Marcada", color: "border-orange-500 text-orange-600" },
    { id: "Proposta", title: "Proposta Enviada", color: "border-green-600 text-green-600" },
    { id: "desistiu", title: "Cliente desistiu", color: "border-red-600 text-red-600" },
];

export default function PipelineLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hoverCol, setHoverCol] = useState<string | null>(null);

    const [openConfirmVenda, setOpenConfirmVenda] = useState(false);
    const [leadParaVenda, setLeadParaVenda] = useState<any>(null);

    const navigate = useNavigate();

    async function carregar() {
        const data = await getLeads();
        setLeads(data || []);
    }

    useEffect(() => {
        carregar();
    }, []);

    async function onDrop(etapaId: string) {
        if (!draggingId) return;

        const lead = leads.find((l) => l.id === draggingId);

        await updateLead(draggingId, { status: etapaId });

        setLeads((prev) =>
            prev.map((l) =>
                l.id === draggingId ? { ...l, status: etapaId, _animate: true } : l
            )
        );

        setDraggingId(null);
        setHoverCol(null);

        if (etapaId === "Proposta" && lead) {
            setLeadParaVenda(lead);
            setOpenConfirmVenda(true);
        }

        setTimeout(() => {
            setLeads((prev) => prev.map((l) => ({ ...l, _animate: false })));
        }, 300);
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <Sidebar />

            <main className="ml-16 p-6 h-screen overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Pipeline</h1>
                        <p className="text-sm text-muted-foreground">
                            Arraste os leads entre as etapas do funil
                        </p>
                    </div>
                </div>

                {/* BOARD COM SCROLL HORIZONTAL */}
                <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-180px)]">

                    {ETAPAS.map((etapa) => {
                        const leadsDaEtapa = leads.filter(
                            (l) => l.status === etapa.id
                        );

                        return (
                            <div
                                key={etapa.id}
                                className={clsx(
                                    "flex flex-col min-w-[300px] max-w-[300px] rounded-2xl bg-muted/40 border transition h-full",
                                    hoverCol === etapa.id && "ring-2 ring-primary/30"
                                )}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setHoverCol(etapa.id);
                                }}
                                onDragLeave={() => setHoverCol(null)}
                                onDrop={() => onDrop(etapa.id)}
                            >
                                {/* HEADER */}
                                <div
                                    className={clsx(
                                        "px-4 py-3 border-t-4 rounded-t-2xl shrink-0",
                                        etapa.color
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{etapa.title}</span>
                                        <Badge variant="secondary">{leadsDaEtapa.length}</Badge>
                                    </div>
                                </div>

                                {/* BODY COM SCROLL INTERNO */}
                                <div className="p-3 space-y-3 overflow-y-auto flex-1">

                                    {leadsDaEtapa.map((lead) => (
                                        <Card
                                            key={lead.id}
                                            draggable
                                            onDragStart={() => setDraggingId(lead.id)}
                                            className={clsx(
                                                "p-4 cursor-move rounded-xl shadow-sm hover:shadow-md transition-all min-h-[90px]",

                                                // animação quando troca de coluna
                                                lead._animate && "animate-fireworks",

                                                // cor vermelha se desistiu
                                                lead.status === "desistiu"
                                                    ? "bg-red-100 border border-red-400 text-red-700"
                                                    : "bg-background"
                                            )}
                                        >


                                            <p className="font-semibold">{lead.nome}</p>

                                            <p className="text-sm text-muted-foreground">
                                                {lead.telefone}
                                            </p>

                                            {lead.interesse && (
                                                <Badge
                                                    variant="outline"
                                                    className="mt-2 text-xs"
                                                >
                                                    {lead.interesse}
                                                </Badge>
                                            )}
                                        </Card>
                                    ))}

                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODAL */}
            <Dialog open={openConfirmVenda} onOpenChange={setOpenConfirmVenda}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finalizar como venda?</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">
                        Deseja transformar o lead{" "}
                        <strong>{leadParaVenda?.nome}</strong> em uma venda?
                    </p>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenConfirmVenda(false)}
                        >
                            Não
                        </Button>
                        <Button
                            onClick={() => {
                                setOpenConfirmVenda(false);
                                navigate("/dashboard/vendas", {
                                    state: { leadId: leadParaVenda.id },
                                });
                            }}
                        >
                            Sim, criar venda
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
