import { api } from '@/lib/api';
import type { Lead } from './lead.service';
import type { Venda } from './venda.service';

export interface OrgDashboardMember {
  id: string;
  name: string;
  email: string;
  creci?: string;
  role: string;
  leads: number;
  vendas: number;
  valor_vendas: string;
  visitas: number;
}

export interface OrgDashboard {
  members: OrgDashboardMember[];
  totals: {
    leads: number;
    vendas: number;
    valor_total: string;
    visitas: number;
  };
}

export interface OrgPipeline {
  novo_cliente: (Lead & { corretor_id: string; corretor_name: string })[];
  em_contato: (Lead & { corretor_id: string; corretor_name: string })[];
  visita_marcada: (Lead & { corretor_id: string; corretor_name: string })[];
  proposta_enviada: (Lead & { corretor_id: string; corretor_name: string })[];
  cliente_desistiu: (Lead & { corretor_id: string; corretor_name: string })[];
}

export type LeadEquipe = Lead & { corretor_id: string; corretor_name: string };
export type VendaEquipe = Venda & { corretor_id: string; corretor_name: string };

export interface OrgProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface OrgInvite {
  id: string;
  email: string;
  status: 'pendente' | 'aceito' | 'cancelado';
  token: string;
  created_at: string;
}

export interface PublicInvite {
  org_name: string;
}

export const orgService = {
  async getProfile(): Promise<OrgProfile> {
    const { data } = await api.get('/org/me');
    return data;
  },

  async updateProfile(payload: Partial<Pick<OrgProfile, 'name' | 'email' | 'phone'>>): Promise<OrgProfile> {
    const { data } = await api.patch('/org/me', payload);
    return data;
  },

  async getMembers(): Promise<OrgMember[]> {
    const { data } = await api.get('/org/members');
    return data;
  },

  async removeMember(userId: string): Promise<void> {
    await api.delete(`/org/members/${userId}`);
  },

  async getInvites(): Promise<OrgInvite[]> {
    const { data } = await api.get('/org/invites');
    return data;
  },

  async createInvite(email: string): Promise<OrgInvite> {
    const { data } = await api.post('/org/invites', { email });
    return data;
  },

  async cancelInvite(id: string): Promise<void> {
    await api.delete(`/org/invites/${id}`);
  },

  async getInviteByToken(token: string): Promise<PublicInvite> {
    const { data } = await api.get(`/org/invites/${token}`);
    return data;
  },

  async acceptInvite(token: string): Promise<{ access_token: string }> {
    const { data } = await api.post(`/org/invites/${token}/accept`);
    return data;
  },

  async getDashboard(): Promise<OrgDashboard> {
    const { data } = await api.get('/org/dashboard');
    return data;
  },

  async getPipeline(): Promise<OrgPipeline> {
    const { data } = await api.get('/org/pipeline');
    return data;
  },

  async getEquipeLeads(): Promise<LeadEquipe[]> {
    const { data } = await api.get('/org/equipe/leads');
    return data;
  },

  async getEquipeVendas(): Promise<VendaEquipe[]> {
    const { data } = await api.get('/org/equipe/vendas');
    return data;
  },
};
