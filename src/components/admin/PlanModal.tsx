import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteNome: string;
  planoAtual: string;
  tipo: "imobiliaria" | "corretor";
  onSave: (plano: string, expira_em?: string) => Promise<void>;
}

const PLANOS = [
  { value: "basic", label: "Basic", color: "border-gray-400 text-gray-600", bg: "bg-gray-50" },
  { value: "premium", label: "Premium", color: "border-blue-500 text-blue-600", bg: "bg-blue-50" },
  { value: "gold", label: "Gold", color: "border-yellow-500 text-yellow-600", bg: "bg-yellow-50" },
];

export function PlanModal({ open, onOpenChange, clienteNome, planoAtual, onSave }: PlanModalProps) {
  const [plano, setPlano] = useState(planoAtual);
  const [expiraEm, setExpiraEm] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setPlano(planoAtual);
      setExpiraEm("");
    }
  }, [open, planoAtual]);

  const handleSave = async () => {
    setSalvando(true);
    try {
      const expira = expiraEm ? new Date(expiraEm + "T23:59:59Z").toISOString() : undefined;
      await onSave(plano, expira);
      onOpenChange(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Plano — {clienteNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Plano</Label>
            <div className="grid grid-cols-3 gap-2">
              {PLANOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlano(p.value)}
                  className={cn(
                    "rounded-lg border-2 py-3 text-sm font-semibold transition-all",
                    p.bg,
                    plano === p.value
                      ? p.color + " ring-2 ring-offset-1 ring-current"
                      : "border-border text-muted-foreground hover:border-current " + p.color
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expira em <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              type="date"
              value={expiraEm}
              onChange={(e) => setExpiraEm(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para acesso permanente.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={salvando}>
            {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Plano
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
