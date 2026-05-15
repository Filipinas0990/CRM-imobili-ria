import { api } from '@/lib/api';

export type EtapaTipo = 'texto' | 'imagem' | 'video' | 'audio';

export interface FunilEtapa {
  id: string;
  funil_id: string;
  ordem: number;
  tipo: EtapaTipo;
  conteudo: string;
  intervalo_antes: number;
}

export interface Funil {
  id: string;
  nome: string;
  descricao: string;
  etapas: FunilEtapa[];
  created_at: string;
  updated_at: string;
}

export interface FunilPayload {
  nome: string;
  descricao?: string;
  etapas: Array<{
    tipo: EtapaTipo;
    conteudo: string;
    ordem: number;
    intervalo_antes: number;
  }>;
}

export const funilService = {
  async listar(): Promise<Funil[]> {
    const { data } = await api.get<Funil[]>('/whatsapp/funis');
    return data ?? [];
  },

  async getById(id: string): Promise<Funil> {
    const { data } = await api.get<Funil>(`/whatsapp/funis/${id}`);
    return data;
  },

  async criar(payload: FunilPayload): Promise<Funil> {
    const { data } = await api.post<Funil>('/whatsapp/funis', payload);
    return data;
  },

  async atualizar(id: string, payload: FunilPayload): Promise<Funil> {
    const { data } = await api.put<Funil>(`/whatsapp/funis/${id}`, payload);
    return data;
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/whatsapp/funis/${id}`);
  },

  // Faz upload de mídia e retorna a URL pública
  async uploadMidia(file: File): Promise<string> {
    const form = new FormData();
    form.append('arquivo', file);
    const { data } = await api.post<{ url: string }>('/whatsapp/funis/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};
