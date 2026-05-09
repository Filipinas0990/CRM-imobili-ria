import { api } from '@/lib/api';

export interface Imovel {
  id: string;
  titulo: string;
  descricao?: string;
  endereco?: string;
  complemento?: string;
  tipo?: string;
  status?: string;
  fase_obra?: string;
  classificacao?: string;
  preco?: number;
  renda_ideal?: number;
  preco_varia?: boolean;
  iptu?: number;
  sob_consulta?: boolean;
  cidade?: string;
  estado?: string;
  bairro?: string;
  cep?: string;
  construtora?: string;
  id_canal_pro?: string;
  area?: number;
  area_minima?: number;
  area_maxima?: number;
  quartos?: number;
  banheiros?: number;
  vagas_garagem?: number;
  unidades_disponiveis?: number;
  // aluguel
  periodo_aluguel?: string;
  condominio?: number;
  deposito?: number;
  aceita_pets?: boolean;
  mobiliado?: boolean;
  // financiamento
  entrada?: number;
  parcelas?: number;
  taxa_juros?: number;
  fgts?: boolean;
  created_at: string;
}

export const imovelService = {
  async getAll(filters?: {
    tipo?: string;
    status?: string;
    cidade?: string;
    search?: string;
  }): Promise<Imovel[]> {
    const params = new URLSearchParams();
    if (filters?.tipo)   params.append('tipo', filters.tipo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.cidade) params.append('cidade', filters.cidade);
    if (filters?.search) params.append('search', filters.search);
    const { data } = await api.get<Imovel[]>(`/imoveis?${params.toString()}`);
    return data;
  },

  async create(payload: Partial<Imovel> & { titulo: string }): Promise<Imovel> {
    const { data } = await api.post<Imovel>('/imoveis', payload);
    return data;
  },

  async update(id: string, payload: Partial<Omit<Imovel, 'id' | 'created_at'>>): Promise<Imovel> {
    const { data } = await api.put<Imovel>(`/imoveis/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/imoveis/${id}`);
  },
};