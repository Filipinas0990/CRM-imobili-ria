import { api } from '@/lib/api';

export interface FluxoItem {
  id: string;
  descricao: string;
  valor: string;
  data: string;
  categoria?: string;
  tipo: 'entrada' | 'saida' | 'financeiro';
  status: 'confirmado' | 'pendente' | 'cancelado';
  recorrente?: boolean;
  dia_vencimento?: number;
  descricao_despesas?: string;
  valor_despesas?: string;
  categoria_despesas?: string;
  forma_pagamento_despesas?: string;
  status_despesas?: string;
  observacoes_despesas?: string;
  created_at: string;
  updated_at: string;
}

export interface FluxoSaldo {
  entradas: number;
  saidas: number;
  saldo: number;
  total_lancamentos: number;
}

export const fluxoService = {
  async getAll(filters?: { tipo?: string; status?: string; categoria?: string }): Promise<FluxoItem[]> {
    const params = new URLSearchParams();
    if (filters?.tipo)      params.append('tipo', filters.tipo);
    if (filters?.status)    params.append('status', filters.status);
    if (filters?.categoria) params.append('categoria', filters.categoria);
    const qs = params.toString();
    const { data } = await api.get<FluxoItem[]>(`/fluxo-caixa${qs ? `?${qs}` : ''}`);
    return data;
  },

  async create(payload: {
    descricao: string;
    valor: number;
    data: string;
    tipo: 'entrada' | 'saida' | 'financeiro';
    categoria?: string;
    status?: 'confirmado' | 'pendente' | 'cancelado';
    dia_vencimento?: number;
    descricao_despesas?: string;
    valor_despesas?: number;
    categoria_despesas?: string;
    forma_pagamento_despesas?: string;
    status_despesas?: string;
    observacoes_despesas?: string;
    recorrente?: boolean;
  }): Promise<FluxoItem> {
    const { data } = await api.post<FluxoItem>('/fluxo-caixa', payload);
    return data;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<FluxoItem> {
    const { data } = await api.put<FluxoItem>(`/fluxo-caixa/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/fluxo-caixa/${id}`);
  },

  async getSaldo(): Promise<FluxoSaldo> {
    const { data } = await api.get<FluxoSaldo>('/fluxo-caixa/saldo');
    return data;
  },
};
