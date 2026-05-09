import { api } from '@/lib/api';

export interface VisitaRaw {
  id: string;
  lead_id: string;
  imovel_id: string;
  data: string;
  horario?: string;
  anotacoes?: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'reagendada';
  lead?: { id: string; name: string; telefone: string };
  imovel?: { id: string; titulo: string; endereco?: string };
  clienteNome?: string;
  clienteTelefone?: string;
  imovelNome?: string;
  imovelEndereco?: string;
}

export const visitaService = {
  async getAll(): Promise<VisitaRaw[]> {
    const { data } = await api.get<VisitaRaw[]>('/visitas');
    return data;
  },

  async create(payload: {
    lead_id: string;
    imovel_id: string;
    data: string;
    horario?: string;
    anotacoes?: string;
    nome_cliente?: string;
    telefone_cliente?: string;
  }): Promise<VisitaRaw> {
    const { data } = await api.post<VisitaRaw>('/visitas', payload);
    return data;
  },

  async updateStatus(id: string, status: string): Promise<VisitaRaw> {
    const { data } = await api.patch<VisitaRaw>(`/visitas/${id}/status`, { status });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/visitas/${id}`);
  },
};
