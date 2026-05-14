import { api } from '@/lib/api';

export interface CampanhaFlow {
  id: string;
  name: string;
}

export interface CampanhaFlowDetail extends CampanhaFlow {
  nodes: Array<{ id: string; type: string; message: string }>;
}

export interface CampanhaPayload {
  leads_ids: string[];
  mensagem: string;
  funil_id?: string;
  intervalo_segundos: number;
}

export interface CampanhaIniciadaResponse {
  id: string;
  total: number;
  intervalo_segundos: number;
  tempo_estimado_minutos: number;
  status: string;
  message: string;
}

export type CampanhaStatus = 'em_andamento' | 'concluido' | 'cancelado' | 'erro';

export interface CampanhaProgresso {
  id: string;
  status: CampanhaStatus;
  total: number;
  enviados: number;
  falhas: number;
  em_execucao: boolean;
  percentual: number;
}

export interface Campanha {
  id: string;
  created_at: string;
  total: number;
  enviados: number;
  falhas: number;
  intervalo_segundos: number;
  status: CampanhaStatus;
}

export const campanhaService = {
  async getFlows(): Promise<CampanhaFlow[]> {
    const { data } = await api.get<any[]>('/whatsapp/flows');
    return (data ?? []).map((f) => ({ id: f.id, name: f.name ?? f.nome ?? '' }));
  },

  async getFlowById(id: string): Promise<CampanhaFlowDetail> {
    const { data } = await api.get<any>(`/whatsapp/flows/${id}`);
    const nodes = (data.nodes ?? data.nos ?? []).map((n: any) => ({
      id: n.id,
      type: n.type as string,
      message: (n.message ?? '') as string,
    }));
    return { id: data.id, name: data.name ?? data.nome ?? '', nodes };
  },

  async iniciar(payload: CampanhaPayload): Promise<CampanhaIniciadaResponse> {
    const body: Record<string, unknown> = {
      leads_ids: payload.leads_ids,
      mensagem: payload.mensagem,
      intervalo_segundos: payload.intervalo_segundos,
    };
    if (payload.funil_id) body.funil_id = payload.funil_id;
    const { data } = await api.post<CampanhaIniciadaResponse>('/whatsapp/campanhas', body);
    return data;
  },

  async getProgresso(id: string): Promise<CampanhaProgresso> {
    const { data } = await api.get<CampanhaProgresso>(`/whatsapp/campanhas/${id}/progresso`);
    return data;
  },

  async cancelar(id: string): Promise<void> {
    await api.delete(`/whatsapp/campanhas/${id}`);
  },

  async listar(): Promise<Campanha[]> {
    const { data } = await api.get<Campanha[]>('/whatsapp/campanhas');
    return data ?? [];
  },
};
