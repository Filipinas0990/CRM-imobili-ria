import { api } from "@/lib/api";

export interface ClienteAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  tipo_conta: string;
  role: string;
  organization_id: string | null;
  plano: string;
  plano_status: string;
  plano_expira_em: string | null;
  created_at: string;
  tipo: "corretor" | "imobiliaria";
  plano_efetivo: string;
  features_ativas: string[];
  features_bloqueadas: string[];
  creci?: string;
}

export interface AdminClientesResponse {
  total_corretores: number;
  total_imobiliarias: number;
  corretores: ClienteAdmin[];
  imobiliarias: ClienteAdmin[];
}

export interface AlterarPlanoPayload {
  plano: string;
  expira_em?: string;
}

export const FEATURE_LABELS: Record<string, string> = {
  leads: "Leads",
  imoveis: "Imóveis",
  tarefas: "Tarefas",
  visitas: "Visitas",
  "fluxo-caixa": "Fluxo de Caixa",
  vendas: "Vendas",
  relatorios: "Relatórios",
  whatsapp: "WhatsApp",
  "whatsapp-ia": "IA do WhatsApp",
  automacoes: "Automações",
  campanhas: "Campanhas",
};

export const FEATURE_PLAN_REQUIRED: Record<string, string> = {
  relatorios: "Premium",
  whatsapp: "Premium",
  "whatsapp-ia": "Premium",
  automacoes: "Premium",
  campanhas: "Premium",
};

export function isExpirado(expira_em: string | null): boolean {
  if (!expira_em) return false;
  return new Date(expira_em) < new Date();
}

export function getPlanoEfetivo(cliente: ClienteAdmin): string {
  if (isExpirado(cliente.plano_expira_em)) return "basic";
  return cliente.plano_efetivo || cliente.plano;
}

export const adminService = {
  async getClientes(): Promise<AdminClientesResponse> {
    const { data } = await api.get<AdminClientesResponse>("/admin/clientes");
    return data;
  },

  async alterarPlanoImobiliaria(id: string, payload: AlterarPlanoPayload): Promise<void> {
    await api.patch(`/admin/imobiliarias/${id}/plano`, payload);
  },

  async alterarPlanoCorretor(id: string, payload: AlterarPlanoPayload): Promise<void> {
    await api.patch(`/admin/corretores/${id}/plano`, payload);
  },
};
