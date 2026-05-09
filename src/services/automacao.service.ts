import { api } from '@/lib/api';

export type NodeType = "start" | "message" | "menu" | "question" | "transfer" | "end";
export type FluxoStatus = "ativo" | "rascunho";
export type TriggerType = "always" | "first_contact" | "off_hours";

export interface MenuOption {
  number: number;
  label: string;
  next_node_id?: string;
}

export interface FluxoNo {
  id: string;
  type: NodeType;
  label: string;
  message: string;
  order_index: number;
  next_node_id?: string;
  delay_seconds?: number;
  x: number;
  y: number;
  options?: MenuOption[];
  variable_name?: string;
  transfer_message?: string;
}

export interface Fluxo {
  id: string;
  nome: string;
  status: FluxoStatus;
  trigger_type: TriggerType;
  instance_name: string;
  restart_after_hours: number;
  nos: FluxoNo[];
}

function nodeFromBackend(n: any): FluxoNo {
  return {
    id: n.id,
    type: n.type as NodeType,
    label: n.label ?? '',
    message: n.message ?? '',
    order_index: n.order_index ?? 0,
    next_node_id: n.next_node_id ?? undefined,
    delay_seconds: n.delay_seconds ?? 2,
    x: n.x ?? 60,
    y: n.y ?? 120,
    options: n.node_data?.options ?? undefined,
    variable_name: n.node_data?.variable_name ?? undefined,
    transfer_message: n.node_data?.transfer_message ?? undefined,
  };
}

function flowFromBackend(f: any): Fluxo {
  const rawNodes: any[] = f.nodes ?? f.nos ?? [];
  return {
    id: f.id,
    nome: f.nome ?? f.name ?? 'Meu Fluxo',
    status: (f.status ?? 'rascunho') as FluxoStatus,
    trigger_type: (f.trigger_type ?? 'always') as TriggerType,
    instance_name: f.instance_name ?? '',
    restart_after_hours: f.restart_after_hours ?? 24,
    nos: rawNodes.map(nodeFromBackend).sort((a, b) => a.order_index - b.order_index),
  };
}

function nodeToBackend(node: FluxoNo, flowId: string, index: number) {
  return {
    id: node.id,
    flow_id: flowId,
    type: node.type,
    label: node.label,
    message: node.message,
    order_index: index,
    next_node_id: node.next_node_id ?? null,
    delay_seconds: node.delay_seconds ?? 2,
    x: Math.round(node.x),
    y: Math.round(node.y),
    node_data: {
      options: node.options ?? null,
      variable_name: node.variable_name ?? null,
      transfer_message: node.transfer_message ?? null,
    },
  };
}

export const automacaoService = {
  async listFlows(): Promise<Fluxo[]> {
    const { data } = await api.get<any[]>('/whatsapp/flows');
    return (data ?? []).map(f => ({ ...flowFromBackend(f), nos: [] }));
  },

  async getFlow(id: string): Promise<Fluxo> {
    const { data } = await api.get<any>(`/whatsapp/flows/${id}`);
    return flowFromBackend(data);
  },

  async createFlow(payload: {
    nome: string;
    trigger_type: TriggerType;
    restart_after_hours: number;
  }): Promise<Fluxo> {
    const { data } = await api.post<any>('/whatsapp/flows', {
      nome: payload.nome,
      name: payload.nome,
      trigger_type: payload.trigger_type,
      restart_after_hours: payload.restart_after_hours,
      status: 'rascunho',
    });
    return flowFromBackend(data);
  },

  async updateFlow(
    id: string,
    payload: Partial<Pick<Fluxo, 'nome' | 'status' | 'trigger_type' | 'restart_after_hours'>>,
  ): Promise<Fluxo> {
    const body: Record<string, unknown> = {};
    if (payload.nome !== undefined) { body.nome = payload.nome; body.name = payload.nome; }
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.trigger_type !== undefined) body.trigger_type = payload.trigger_type;
    if (payload.restart_after_hours !== undefined) body.restart_after_hours = payload.restart_after_hours;
    const { data } = await api.put<any>(`/whatsapp/flows/${id}`, body);
    return flowFromBackend(data);
  },

  async deleteFlow(id: string): Promise<void> {
    await api.delete(`/whatsapp/flows/${id}`);
  },

  // Sincroniza todos os nós: cria novos, atualiza existentes, deleta removidos
  async saveNodes(flowId: string, nodes: FluxoNo[]): Promise<void> {
    const { data: existing } = await api.get<any[]>(`/whatsapp/flows/${flowId}/nodes`);
    const existingIds = new Set((existing ?? []).map((n: any) => n.id));
    const currentIds = new Set(nodes.map(n => n.id));

    // Deleta nós removidos
    const toDelete = [...existingIds].filter(id => !currentIds.has(id));
    await Promise.all(toDelete.map(id => api.delete(`/whatsapp/nodes/${id}`)));

    // Cria ou atualiza cada nó em sequência para preservar order_index
    for (let i = 0; i < nodes.length; i++) {
      const body = nodeToBackend(nodes[i], flowId, i);
      if (existingIds.has(nodes[i].id)) {
        await api.put(`/whatsapp/nodes/${nodes[i].id}`, body);
      } else {
        await api.post(`/whatsapp/flows/${flowId}/nodes`, body);
      }
    }
  },
};
