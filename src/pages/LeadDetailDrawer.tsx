import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Phone, Mail, Clock } from "lucide-react";
import { Calendar, Pencil, Trash2 } from "lucide-react";


interface LeadDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    lead: any | null;

    onEdit: (lead: any) => void;
    onDelete: (lead: any) => void;
    onFollowUp: (lead: any) => void;
}


export function LeadDetailDrawer({
    open,
    onClose,
    lead,
    onEdit,
    onDelete,
    onFollowUp,

}: LeadDetailDrawerProps) {

    if (!open || !lead) return null;

    const phone = lead.telefone?.replace(/\D/g, "");

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-[420px] h-full bg-background shadow-2xl animate-in slide-in-from-right flex flex-col">
                {/* HEADER */}
                <div className="p-6 border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold leading-tight">
                                {lead.nome}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {lead.origem || "WhatsApp"}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* BOTÃO WHATSAPP */}
                    <Button
                        className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
                        onClick={() =>
                            window.open(`https://wa.me/55${phone}`, "_blank")
                        }
                    >
                        WhatsApp
                    </Button>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* CONTATO */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold">Contato</p>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            {lead.telefone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{lead.telefone}</span>
                                </div>
                            )}

                            {lead.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{lead.email}</span>
                                </div>
                            )}
                        </div>
                    </div>




                    {/* INTERESSE / OBSERVAÇÕES */}
                    {lead.interesse && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">
                                Interesses
                            </p>
                            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                                {lead.interesse}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Observações</p>

                        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground whitespace-pre-line">
                            {lead.observacoes || "Nenhuma observação cadastrada"}
                        </div>
                    </div>

                    {/* STATUS */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Status</p>
                        <Badge variant="outline">
                            {lead.status || "Novo"}
                        </Badge>
                    </div>

                    {/* HISTÓRICO */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold">Histórico</p>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Criado em {lead.created_at || "-"}</span>
                            </div>

                            {lead.updated_at && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        Atualizado em {lead.updated_at}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AÇÕES */}
                <div className="p-6 border-t space-y-3">
                    {/* AGENDAR FOLLOW-UP */}
                    <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        onClick={() => {
                            onClose();
                            onFollowUp(lead);
                        }}
                    >
                        <Calendar className="w-4 h-4" />
                        Agendar Follow-up
                    </Button>

                    {/* EDITAR + EXCLUIR */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => {
                                onClose();
                                onEdit(lead);
                            }}
                        >
                            <Pencil className="w-4 h-4" />
                            Editar
                        </Button>

                        <Button
                            variant="destructive"
                            className="flex items-center gap-2"
                            onClick={() => {
                                onClose();
                                onDelete(lead);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                        </Button>
                    </div>
                </div>
            </div>
        </div>

    );
}
