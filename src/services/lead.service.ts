import { api } from '@/lib/api';

export interface Lead {
  id: string;
  name: string;
  telefone: string;
  email?: string;
  status: string;
  interesse?: string;
  temperatura?: number;
  gestor_responsavel?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Mapeia temperatura texto → número
function mapTemperatura(temp: string): number {
  const t = temp?.toLowerCase() ?? '';
  if (t.includes('quente')) return 3;
  if (t.includes('morno'))  return 2;
  return 1;
}

// Mapeia número → texto (para exibir no front)
export function mapTemperaturaLabel(temp: number): string {
  if (temp === 3) return 'QUENTE🔥';
  if (temp === 2) return 'MORNO⛅';
  return 'FRIO❄️';
}

// Mapeia status do front → status do back-end
function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'novo':     'novo_cliente',
    'contato':  'em_contato',
    'Visista':  'visita_marcada',
    'Proposta': 'proposta_enviada',
    'desistiu': 'cliente_desistiu',
    'bolsao':   'bolsao',
  };
  return map[status] ?? status;
}

// Mapeia status do back-end → status do front
function mapStatusFront(status: string): string {
  const map: Record<string, string> = {
    'novo_cliente':     'novo',
    'em_contato':       'contato',
    'visita_marcada':   'Visista',
    'proposta_enviada': 'Proposta',
    'cliente_desistiu': 'desistiu',
    'bolsao':           'bolsao',
  };
  return map[status] ?? status;
}

export const leadService = {
  async getAll(filters?: { search?: string; status?: string }): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    const { data } = await api.get<Lead[]>(`/leads?${params.toString()}`);
    return data.map(l => ({ ...l, status: mapStatusFront(l.status) }));
  },

  async create(payload: {
    nome: string;
    telefone: string;
    email?: string;
    status?: string;
    interesse?: string;
    temperatura?: string;
    gestor_responsavel?: string;
    observacoes?: string;
  }): Promise<Lead> {
    const { data } = await api.post<Lead>('/leads', {
      name:               payload.nome,
      telefone:           payload.telefone,
      email:              payload.email || undefined,
      status:             mapStatus(payload.status ?? 'novo'),
      interesse:          payload.interesse,
      temperatura:        mapTemperatura(payload.temperatura ?? ''),
      gestor_responsavel: payload.gestor_responsavel,
      observacoes:        payload.observacoes,
    });
    return data;
  },

  async update(id: string, payload: {
    nome?: string;
    telefone?: string;
    email?: string;
    status?: string;
    interesse?: string;
    temperatura?: string;
    observacoes?: string;
  }): Promise<Lead> {
    const body: Record<string, unknown> = {};
    if (payload.nome)        body.name        = payload.nome;
    if (payload.telefone)    body.telefone    = payload.telefone;
    if (payload.email)       body.email       = payload.email;
    if (payload.status)      body.status      = mapStatus(payload.status);
    if (payload.interesse)   body.interesse   = payload.interesse;
    if (payload.temperatura) body.temperatura = mapTemperatura(payload.temperatura);
    if (payload.observacoes) body.observacoes = payload.observacoes;

    const { data } = await api.put<Lead>(`/leads/${id}`, body);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/leads/${id}`);
  },

  async updateStatus(id: string, status: string): Promise<Lead> {
    const { data } = await api.patch<Lead>(`/leads/${id}/status`, { status: mapStatus(status) });
    return { ...data, status: mapStatusFront(data.status) };
  },

  async getPipeline(): Promise<Record<string, Lead[]>> {
    const { data } = await api.get('/leads/pipeline');
    return data;
  },
};