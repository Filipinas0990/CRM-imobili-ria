import { api } from '@/lib/api';

export interface Venda {
  id: string;
  valor: number;
  tipo: string;
  status: string;
  lead_id: string | null;
  imovel_id: string | null;
  created_at: string;
  data_venda?: string;
  base_calculo_pct?: number;
  percentual_imposto?: number;
  valor_indicacao?: number;
  premiacao_venda?: number;
  data_prev_comissao?: string;
  base_calculo_tipo?: string;
  construtora?: string;
  observacoes?: string;
}

export interface VendaResumo {
  total_vendas: number;
  vendas_concluidas: number;
  valor_total: number;
  comissao_total: number;
  por_status: Record<string, number>;
}

// Mapeia status do front → back-end
function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'Em negociação':   'Em negociação',
    'Proposta enviada': 'Proposta enviada',
    'Fechada':         'Contrato assinado',
    'Perdida':         'Cancelada',
    'Concluída':       'Concluída',
  };
  return map[status] ?? status;
}

// Mapeia status do back-end → front
export function mapStatusFront(status: string): string {
  const map: Record<string, string> = {
    'Em negociação':    'Em negociação',
    'Proposta enviada': 'Proposta enviada',
    'Contrato assinado': 'Fechada',
    'Concluída':        'Fechada',
    'Cancelada':        'Perdida',
  };
  return map[status] ?? status;
}

export const vendaService = {
  async getAll(filters?: { status?: string; tipo?: string }): Promise<Venda[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo)   params.append('tipo', filters.tipo);
    const { data } = await api.get<Venda[]>(`/vendas?${params.toString()}`);
    return data.map(v => ({ ...v, status: mapStatusFront(v.status) }));
  },

  async create(payload: {
    lead_id?: string | null;
    imovel_id?: string | null;
    valor: number;
    tipo?: string;
    status?: string;
    data_venda?: string | null;
    base_calculo_tipo?: string;
    base_calculo_pct?: number;
    percentual_imposto?: number;
    valor_indicacao?: number;
    premiacao_venda?: number | null;
    data_prev_comissao?: string | null;
    construtora?: string;
  }): Promise<Venda> {
    const { data } = await api.post<Venda>('/vendas', {
      ...payload,
      status: mapStatus(payload.status ?? 'Em negociação'),
      lead_id:   payload.lead_id   || undefined,
      imovel_id: payload.imovel_id || undefined,
      data_venda:          payload.data_venda          || undefined,
      data_prev_comissao:  payload.data_prev_comissao  || undefined,
      premiacao_venda:     payload.premiacao_venda     || undefined,
    });
    return { ...data, status: mapStatusFront(data.status) };
  },

  async updateStatus(id: string, status: string): Promise<Venda> {
    const { data } = await api.patch<Venda>(`/vendas/${id}/status`, {
      status: mapStatus(status),
    });
    return { ...data, status: mapStatusFront(data.status) };
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vendas/${id}`);
  },

  async getResumo(): Promise<VendaResumo> {
    const { data } = await api.get<VendaResumo>('/vendas/resumo');
    return data;
  },
};