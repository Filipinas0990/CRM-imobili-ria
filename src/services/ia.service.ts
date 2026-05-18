import { api } from '@/lib/api';

export interface IARegra {
  palavra_chave: string;
  novo_status: 'em_atendimento' | 'fechado' | 'pendente';
  pausar_ia: boolean;
}

export interface IAConfig {
  id?: string;
  ativo: boolean;
  instancias: string[];
  openai_api_key?: string;
  modelo: string;
  max_tokens: number;
  temperatura: number;
  prompt_sistema: string;
  regras: IARegra[];
}

export interface EvolutionInstance {
  instance: {
    instanceName: string;
    state: string;
  };
}

export const iaService = {
  async getConfig(): Promise<IAConfig> {
    const { data } = await api.get<IAConfig>('/whatsapp/ia/config');
    return data;
  },

  async saveConfig(payload: Partial<IAConfig>): Promise<IAConfig> {
    const { data } = await api.post<IAConfig>('/whatsapp/ia/config', payload);
    return data;
  },

  async getInstancias(): Promise<EvolutionInstance[]> {
    const { data } = await api.get<EvolutionInstance[]>('/whatsapp/evolution/instance/fetchInstances');
    return data ?? [];
  },
};
