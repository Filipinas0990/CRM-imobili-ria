import { useState, useEffect } from "react";
import clsx from "clsx";

import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
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
    { id: "novo", title: "Leads", header: "bg-blue-500" },
    { id: "contato", title: "Em contato", header: "bg-yellow-500" },
    { id: "Visista", title: "Visita Marcada", header: "bg-orange-500" },
    { id: "Proposta", title: "Proposta Enviada", header: "bg-green-600" },
    {
        id: "desistiu",
        title: "Cliente desistiu",
        header: "bg-red-600",
        danger: true,
    },
];

export default function PipelineLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hoverCol, setHoverCol] = useState<string | null>(null);

    // 🔥 estados do fluxo de venda
    const [openConfirmVenda, setOpenConfirmVenda] = useState(false);
    const [leadParaVenda, setLeadParaVenda] = useState<any>(null);

    const [openVenda, setOpenVenda] = useState(false);
    const [leadSelecionado, setLeadSelecionado] = useState<any>(null);
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
                l.id === draggingId
                    ? { ...l, status: etapaId, _animate: true }
                    : l
            )
        );

        setDraggingId(null);
        setHoverCol(null);

        // 🔥 SE CAIU EM FECHAMENTO → ABRE MODAL
        if (etapaId === "Proposta" && lead) {
            setLeadParaVenda(lead);
            setOpenConfirmVenda(true);
        }

        setTimeout(() => {
            setLeads((prev) =>
                prev.map((l) => ({ ...l, _animate: false }))
            );
        }, 300);
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <main className="ml-16 p-6 h-screen overflow-hidden">
                <h1 className="text-3xl font-bold mb-6">Pipeline de Leads</h1>


                <div className="grid grid-cols-5 gap-4 h-[calc(100%-80px)]">
                    {ETAPAS.map((etapa) => (
                        <div
                            key={etapa.id}
                            className={clsx(
                                "flex flex-col rounded-xl border transition-colors",
                                hoverCol === etapa.id && "bg-accent/40"
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
                                    "px-4 py-3 rounded-t-xl font-semibold text-white",
                                    etapa.header
                                )}
                            >
                                {etapa.title}
                            </div>

                            {/* BODY */}
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                {leads
                                    .filter((l) => l.status === etapa.id)
                                    .map((lead) => (
                                        <Card
                                            key={lead.id}
                                            draggable
                                            onDragStart={() => setDraggingId(lead.id)}
                                            className={clsx(
                                                "p-3 cursor-move transition-all duration-300",
                                                etapa.danger
                                                    ? "bg-red-600 text-white shadow-md"
                                                    : "bg-background shadow-sm hover:shadow-md",
                                                lead._animate && "scale-105"
                                            )}
                                        >
                                            <p className="font-semibold">{lead.nome}</p>
                                            <p className="text-sm opacity-80">
                                                {lead.telefone}
                                            </p>

                                            {lead.interesse && (
                                                <p className="text-xs mt-1 opacity-80">
                                                    Interesse: {lead.interesse}
                                                </p>
                                            )}
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* 🔥 MODAL CONFIRMAR VENDA */}
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
