import { api } from '@/lib/api';

export type TarefaStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUÍDA' | 'CANCELADA';
export type TarefaPrioridade = 'normal' | 'alta' | 'urgente';
export type TarefaTipo = 'chamada' | 'reuniao' | 'tarefa' | 'prazo' | 'email' | 'almoco';

export interface Tarefa {
  id: string;
  user_id: string;
  lead_id?: string | null;
  tipo: TarefaTipo;
  titulo: string;
  descricao?: string | null;
  anotacoes?: string | null;
  pessoa?: string | null;
  telefone?: string | null;
  email?: string | null;
  prioridade: TarefaPrioridade;
  status: TarefaStatus;
  data_inicio?: string | null;
  data_fim?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTarefaPayload {
  lead_id?: string;
  tipo: TarefaTipo;
  titulo: string;
  descricao?: string;
  anotacoes?: string;
  pessoa?: string;
  telefone?: string;
  prioridade?: TarefaPrioridade;
  status?: TarefaStatus;
  data_inicio?: string;
  data_fim?: string;
}

export const tarefaService = {
  async getAll(filters?: { status?: string; prioridade?: string; lead_id?: string }): Promise<Tarefa[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.prioridade) params.append('prioridade', filters.prioridade);
    if (filters?.lead_id) params.append('lead_id', filters.lead_id);
    const { data } = await api.get<Tarefa[]>(`/tarefas?${params.toString()}`);
    return data;
  },

  async create(payload: CreateTarefaPayload): Promise<Tarefa> {
    const { data } = await api.post<Tarefa>('/tarefas', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateTarefaPayload>): Promise<Tarefa> {
    const { data } = await api.put<Tarefa>(`/tarefas/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tarefas/${id}`);
  },

  async concluir(id: string): Promise<Tarefa> {
    const { data } = await api.patch<Tarefa>(`/tarefas/${id}/concluir`);
    return data;
  },

  async updateStatus(id: string, status: TarefaStatus): Promise<Tarefa> {
    const { data } = await api.patch<Tarefa>(`/tarefas/${id}/status`, { status });
    return data;
  },
};