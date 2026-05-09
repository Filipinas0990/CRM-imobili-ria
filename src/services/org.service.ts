import { api } from '@/lib/api';

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
};
