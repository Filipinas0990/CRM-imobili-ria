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
import { Pencil, Trash2 } from "lucide-react";

import { getVendas } from "@/integrations/supabase/vendas/getVendas";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createVenda } from "@/integrations/supabase/vendas/createVenda";
import { updateVendaStatus } from "@/integrations/supabase/vendas/updateVenda";
import { deleteVenda } from "@/integrations/supabase/vendas/deleteVendas";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/components/ui/use-toast";

type VendaStatus =
    | "Em negociação"
    | "Proposta enviada"
    | "Fechada"
    | "Perdida";



type Venda = {
    id: string;
    valor: number;
    tipo: "Venda" | "Locação";
    status: string;
    lead_id: string | null;
    imovel_id: string | null;
};

export default function Vendas() {
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [imoveis, setImoveis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { toast } = useToast();

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
        setLoading(true);
        try {
            const [vendasData, leadsData, imoveisData] = await Promise.all([
                getVendas(),
                getLeads(),
                getImoveis(),
            ]);

            setVendas(vendasData || []);
            setLeads(leadsData || []);
            setImoveis(imoveisData || []);
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    async function handleCreateVenda() {
        await createVenda({
            lead_id: leadId || null,
            imovel_id: imovelId || null,
            valor: Number(valor),
            tipo,
            status,
        });

        toast({
            title: "Venda cadastrada com sucesso!",
            description: "A venda foi salva no sistema.",
            className: "bg-green-500 text-white",
        });

        setOpen(false);
        setLeadId("");
        setImovelId("");
        setValor("");
        setTipo("Venda");
        setStatus("Em negociação");

        loadAll();
    }

    function getLeadNome(id: string | null) {
        if (!id) return "Lead não informado";
        return leads.find((l) => l.id === id)?.nome || "Lead não encontrado";
    }

    function getImovelTitulo(id: string | null) {
        if (!id) return "Imóvel não informado";
        return imoveis.find((i) => i.id === id)?.titulo || "Imóvel não encontrado";
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <main className="ml-16 overflow-y-auto">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Gestão de Vendas</h1>
                            <p className="text-muted-foreground">
                                Aqui você pode gerenciar todas as vendas.
                            </p>
                        </div>
                        <Button onClick={() => setOpen(true)}>Nova Venda</Button>
                    </div>

                    {/* LISTA */}
                    {loading ? (
                        <p className="text-muted-foreground">Carregando vendas...</p>
                    ) : vendas.length === 0 ? (
                        <p className="text-muted-foreground">
                            Nenhuma venda cadastrada.
                        </p>
                    ) : (
                        vendas.map((v) => (
                            <div
                                key={v.id}
                                className="flex justify-between items-center border rounded-lg p-4"
                            >
                                <div>
                                    <p className="font-medium">{getLeadNome(v.lead_id)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {getImovelTitulo(v.imovel_id)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge variant="outline">{v.tipo}</Badge>
                                    <Badge className="bg-blue-600">{v.status}</Badge>

                                    <span className="font-semibold">
                                        R$ {v.valor.toLocaleString("pt-BR")}
                                    </span>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setVendaEditando(v);
                                            setNovoStatus(v.status);
                                            setOpenEdit(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4 text-green-700" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={async () => {
                                            if (!confirm("Deseja apagar esta venda?")) return;

                                            await deleteVenda(v.id);

                                            toast({
                                                title: "Venda removida",
                                                description: "A venda foi apagada com sucesso.",
                                                variant: "destructive",
                                            });

                                            loadAll();
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
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
