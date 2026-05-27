import { api } from '@/lib/api';

export interface Etiqueta {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  keyword_trigger: string | null;
  keyword_type: 'contains';
  created_at: string;
  updated_at: string;
}

export interface EtiquetaResumida {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface EtiquetaStat {
  etiqueta_id: string;
  name: string;
  color: string;
  total_leads: number;
  series: { date: string; count: number }[];
}

export interface EtiquetaPayload {
  name: string;
  color: string;
  icon: string;
  keyword_trigger?: string | null;
  keyword_type?: 'contains';
}

export const etiquetaService = {
  async getAll(): Promise<Etiqueta[]> {
    const { data } = await api.get<Etiqueta[]>('/etiquetas');
    return data;
  },

  async create(payload: EtiquetaPayload): Promise<Etiqueta> {
    const { data } = await api.post<Etiqueta>('/etiquetas', payload);
    return data;
  },

  async update(id: string, payload: Partial<EtiquetaPayload>): Promise<Etiqueta> {
    const { data } = await api.put<Etiqueta>(`/etiquetas/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/etiquetas/${id}`);
  },

  async getStats(): Promise<EtiquetaStat[]> {
    const { data } = await api.get<EtiquetaStat[]>('/etiquetas/stats');
    return data;
  },

  async aplicarNoLead(leadId: string, etiquetaId: string): Promise<void> {
    await api.post(`/leads/${leadId}/etiquetas/${etiquetaId}`);
  },

  async removerDoLead(leadId: string, etiquetaId: string): Promise<void> {
    await api.delete(`/leads/${leadId}/etiquetas/${etiquetaId}`);
  },
};
