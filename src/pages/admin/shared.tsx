import { Badge } from "@/components/ui/badge";
import { isExpirado } from "@/services/admin.service";

export function PlanBadge({ plano }: { plano: string }) {
  if (plano === "gold")
    return <Badge style={{ background: "#F59E0B", color: "#fff", border: "none" }}>Gold</Badge>;
  if (plano === "premium")
    return <Badge style={{ background: "#3B82F6", color: "#fff", border: "none" }}>Premium</Badge>;
  return <Badge style={{ background: "#6B7280", color: "#fff", border: "none" }}>Basic</Badge>;
}

export function StatusBadge({ status, expira_em }: { status: string; expira_em: string | null }) {
  if (isExpirado(expira_em)) {
    return <Badge style={{ background: "#F97316", color: "#fff", border: "none" }}>Expirado</Badge>;
  }
  if (status === "active")
    return <Badge style={{ background: "#10B981", color: "#fff", border: "none" }}>Ativo</Badge>;
  return <Badge style={{ background: "#EF4444", color: "#fff", border: "none" }}>Inativo</Badge>;
}
