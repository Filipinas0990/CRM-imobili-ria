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
import { Pencil, Trash2, Wallet, CheckCircle2, Clock } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { getVendas } from "@/integrations/supabase/vendas/getVendas";
import { getLeads } from "@/integrations/supabase/leads/getLeads";
import { getImoveis } from "@/integrations/supabase/imoveis/getImoveis";
import { createVenda } from "@/integrations/supabase/vendas/createVenda";
import { updateVendaStatus } from "@/integrations/supabase/vendas/updateVenda";
import { deleteVenda } from "@/integrations/supabase/vendas/deleteVendas";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/components/ui/use-toast";

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
    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [busca, setBusca] = useState("");

    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [leadId, setLeadId] = useState("");
    const [imovelId, setImovelId] = useState("");
    const [tipo, setTipo] = useState("Venda");
    const [status, setStatus] = useState("Em negociação");
    const [valor, setValor] = useState("");

    const [openEdit, setOpenEdit] = useState(false);
    const [vendaEditando, setVendaEditando] = useState<Venda | null>(null);
    const [novoStatus, setNovoStatus] = useState("");

    async function loadAll() {
        setLoading(true);
        const [vendasData, leadsData, imoveisData] = await Promise.all([
            getVendas(),
            getLeads(),
            getImoveis(),
        ]);
        setVendas(vendasData || []);
        setLeads(leadsData || []);
        setImoveis(imoveisData || []);
        setLoading(false);
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

        toast({ title: "Venda cadastrada!", className: "bg-green-600 text-white" });

        setOpen(false);
        setLeadId("");
        setImovelId("");
        setValor("");
        setTipo("Venda");
        setStatus("Em negociação");

        loadAll();
    }

    function getLeadNome(id: string | null) {
        if (loading) return "Carregando lead...";
        if (!id) return "Lead não informado";
        const lead = leads.find((l) => l.id === id);
        return lead ? lead.nome : "Lead não encontrado";
    }

    function getImovelTitulo(id: string | null) {
        if (loading) return "Carregando imóvel...";
        if (!id) return "Imóvel não informado";
        const imovel = imoveis.find((i) => i.id === id);
        return imovel ? imovel.titulo : "Imóvel não encontrado";
    }

    const totalVendas = vendas.length;
    const vendasFechadas = vendas.filter((v) => v.status === "Fechada");
    const vendasAbertas = vendas.filter((v) => v.status !== "Fechada");
    const vendasFiltradas = vendas.filter((v) => {
        const statusOk = filtroStatus === "todos" || v.status === filtroStatus;
        const tipoOk = filtroTipo === "todos" || v.tipo === filtroTipo;
        const textoBusca = busca.toLowerCase();
        const leadNome = getLeadNome(v.lead_id).toLowerCase();
        const imovelNome = getImovelTitulo(v.imovel_id).toLowerCase();
        const buscaOk = leadNome.includes(textoBusca) || imovelNome.includes(textoBusca);
        return statusOk && tipoOk && buscaOk;
    });

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <main className="ml-16 p-8 space-y-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="space-y-3">
                        <div>
                            <h1 className="text-2xl font-bold">Gestão de Vendas</h1>
                            <p className="text-muted-foreground">
                                Aqui você pode gerenciar todas as vendas.
                            </p>
                        </div>

                        {/* FILTROS */}
                        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
                            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                <SelectTrigger className="w-[180px] h-11 bg-background">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="Em negociação">Em negociação</SelectItem>
                                    <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                                    <SelectItem value="Fechada">Fechada</SelectItem>
                                    <SelectItem value="Perdida">Perdida</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                <SelectTrigger className="w-[180px] h-11 bg-background">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="Venda">Venda</SelectItem>
                                    <SelectItem value="Locação">Locação</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select>
                                <SelectTrigger className="w-[220px] h-11 bg-background">
                                    <SelectValue placeholder="Empreendimento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1 min-w-[220px]">
                                <input
                                    placeholder="Buscar por venda..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="h-11 w-full rounded-lg border border-border bg-background px-4 pr-10 text-sm text-foreground shadow-sm focus:ring-2 focus:ring-green-600 outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    🔍
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button className="bg-green-700 hover:bg-green-800" onClick={() => setOpen(true)}>
                        + Nova Venda
                    </Button>
                </div>

                {/* RESUMO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                        <Wallet className="text-green-700" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Vendas</p>
                            <p className="text-2xl font-bold text-foreground">{totalVendas}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                        <Clock className="text-orange-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Vendas em Aberto</p>
                            <p className="text-2xl font-bold text-foreground">{vendasAbertas.length}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
                        <CheckCircle2 className="text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Vendas Fechadas</p>
                            <p className="text-2xl font-bold text-foreground">{vendasFechadas.length}</p>
                        </div>
                    </div>
                </div>

                {/* LISTA */}
                <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
                    {loading ? (
                        <p className="p-6 text-muted-foreground">Carregando vendas...</p>
                    ) : vendasFiltradas.length === 0 ? (
                        <p className="p-6 text-muted-foreground">Nenhuma venda cadastrada.</p>
                    ) : (
                        vendasFiltradas.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-5 hover:bg-muted/40 transition">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Wallet className="text-green-700 h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{getLeadNome(v.lead_id)}</p>
                                        <p className="text-sm text-muted-foreground">{getImovelTitulo(v.imovel_id)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant="outline">{v.tipo}</Badge>
                                    <Badge className="bg-blue-600">{v.status}</Badge>
                                    <span className="font-semibold min-w-[120px] text-right text-foreground">
                                        R$ {v.valor.toLocaleString("pt-BR")}
                                    </span>

                                    <Button
                                        variant="ghost"
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
                                        variant="ghost"
                                        size="icon"
                                        onClick={async () => {
                                            if (!confirm("Deseja apagar esta venda?")) return;
                                            await deleteVenda(v.id);
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

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Lead</label>
                        <Select value={leadId} onValueChange={setLeadId}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione o lead" />
                            </SelectTrigger>
                            <SelectContent>
                                {leads.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Imóvel</label>
                        <Select value={imovelId} onValueChange={setImovelId}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione o imóvel" />
                            </SelectTrigger>
                            <SelectContent>
                                {imoveis.map((i) => (
                                    <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Tipo</label>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Venda">Venda</SelectItem>
                                <SelectItem value="Locação">Locação</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Em negociação">Em negociação</SelectItem>
                                <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                                <SelectItem value="Fechada">Venda realizada</SelectItem>
                                <SelectItem value="Perdida">Cliente desistiu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <input
                        type="number"
                        className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
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
                        className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
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