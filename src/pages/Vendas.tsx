import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

import { getVendas } from "@/integrations/supabase/vendas/getVendas";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createVenda } from "@/integrations/supabase/vendas/createVenda";
import { updateVendaStatus } from "@/integrations/supabase/vendas/updateVenda";
import { Sidebar } from "@/components/Sidebar";

type Venda = {
    id: string;
    valor: number;
    tipo: string;
    status: string;
    leads?: { id: string; nome: string }[];
    imoveis?: { id: string; titulo: string }[];

};

export default function Vendas() {
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [imoveis, setImoveis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // modal nova venda
    const [open, setOpen] = useState(false);
    const [leadId, setLeadId] = useState("");
    const [imovelId, setImovelId] = useState("");
    const [tipo, setTipo] = useState("Venda");
    const [status, setStatus] = useState("Em negociação");
    const [valor, setValor] = useState("");

    // editar status
    const [openEdit, setOpenEdit] = useState(false);
    const [vendaEditando, setVendaEditando] = useState<Venda | null>(null);
    const [novoStatus, setNovoStatus] = useState("");


    async function loadAll() {
        try {
            const vendasData = await getVendas();
            const leadsData = await getLeads();
            const imoveisData = await getImoveis();

            setVendas(vendasData ?? []);
            setLeads(leadsData ?? []);
            setImoveis(imoveisData ?? []);


            setVendas(vendasData || []);
            setLeads(leadsData || []);
            setImoveis(imoveisData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    async function handleCreateVenda() {
        await createVenda({
            lead_id: leadId,
            imovel_id: imovelId,
            valor: Number(valor),
            tipo,
            status,
        });

        setOpen(false);
        loadAll();
    }

    if (loading) return <p>Carregando...</p>;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            {/* CONTEÚDO AJUSTADO À SIDEBAR FIXA */}
            <main className="ml-16 overflow-y-auto">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Gestão de Vendas</h1>
                            <p className="text-muted-foreground">Aqui você pode gerenciar todas as vendas.</p>

                        </div>
                        <Button onClick={() => setOpen(true)}>Nova Venda</Button>
                    </div>

                    {vendas.map((v) => (
                        <div
                            key={v.id}
                            className="flex justify-between items-center border rounded-lg p-4"
                        >
                            <div>
                                <p className="font-medium">
                                    {v.leads?.[0]?.nome
                                        || "Lead não informado"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {v.imoveis?.[0]?.titulo || "Imóvel não informado"}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Badge variant="outline">{v.tipo}</Badge>

                                <Badge className="bg-blue-600">{v.status}</Badge>

                                <span className="font-semibold">
                                    R$ {v.valor.toLocaleString("pt-BR")}
                                </span>

                                {/* BOTÃO EDITAR (LAYOUT CLEAN) */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => {
                                        setVendaEditando(v);
                                        setNovoStatus(v.status);
                                        setOpenEdit(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4 text-green-700" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* MODAL NOVA VENDA */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Venda</DialogTitle>
                    </DialogHeader>

                    <select
                        className="w-full border rounded-md px-3 py-2"
                        value={leadId}
                        onChange={(e) => setLeadId(e.target.value)}
                    >
                        <option value="">Selecione o lead</option>
                        {leads.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.nome}
                            </option>
                        ))}
                    </select>

                    <select
                        className="w-full border rounded-md px-3 py-2"
                        value={imovelId}
                        onChange={(e) => setImovelId(e.target.value)}
                    >
                        <option value="">Selecione o imóvel</option>
                        {imoveis.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.titulo}
                            </option>
                        ))}
                    </select>

                    <select
                        className="w-full border rounded-md px-3 py-2"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <option value="Venda">Venda</option>
                        <option value="Locação">Locação</option>
                    </select>

                    <select
                        className="w-full border rounded-md px-3 py-2"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="Em negociação">Em negociação</option>
                        <option value="Proposta enviada">Proposta enviada</option>
                        <option value="Fechada">Venda realizada</option>
                        <option value="Perdida">Cliente desistiu</option>
                    </select>

                    <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Valor"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                    />

                    <DialogFooter>
                        <Button onClick={handleCreateVenda}>Salvar Venda</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL EDITAR STATUS */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar status</DialogTitle>
                    </DialogHeader>

                    <select
                        className="w-full border rounded-md px-3 py-2"
                        value={novoStatus}
                        onChange={(e) => setNovoStatus(e.target.value)}
                    >
                        <option value="Em negociação">Em negociação</option>
                        <option value="Proposta enviada">Proposta enviada</option>
                        <option value="Fechada">Venda realizada</option>
                        <option value="Perdida">Cliente desistiu</option>
                    </select>

                    <DialogFooter>
                        <Button
                            onClick={async () => {
                                if (!vendaEditando) return;
                                await updateVendaStatus(vendaEditando.id, novoStatus);
                                setOpenEdit(false);
                                setVendaEditando(null);
                                loadAll();
                            }}
                        >
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
