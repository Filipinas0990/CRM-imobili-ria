import { api } from '@/lib/api';

export type MetaTipo = 'novos_clientes' | 'visitas' | 'propostas';

export interface Meta {
  id: string;
  user_id: string;
  tipo: MetaTipo;
  valor_alvo: number;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface MetaComProgresso extends Meta {
  progresso: number;  // quantidade realizada
  percentual: number; // 0–100
}

export interface MetaPayload {
  tipo: MetaTipo;
  valor_alvo: number;
  data_inicio: string;
  data_fim: string;
}

export const metaService = {
  async getAll(): Promise<MetaComProgresso[]> {
    const { data } = await api.get<MetaComProgresso[]>('/metas');
    return data;
  },

  async create(payload: MetaPayload): Promise<Meta> {
    const { data } = await api.post<Meta>('/metas', payload);
    return data;
  },

  async update(id: string, payload: Partial<MetaPayload>): Promise<Meta> {
    const { data } = await api.put<Meta>(`/metas/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/metas/${id}`);
  },
};
