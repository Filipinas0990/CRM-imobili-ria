import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  creci?: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    tipo_conta: 'corretor' | 'imobiliaria';
    role: 'owner' | 'member' | 'admin';
    organization_id: string | null;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<void> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    useAuthStore.getState().setAuth(data.user, data.access_token);
  },

  async register(payload: RegisterPayload): Promise<void> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    useAuthStore.getState().setAuth(data.user, data.access_token);
  },

  async logout(): Promise<void> {
    await api.delete('/auth/logout');
    useAuthStore.getState().clearAuth();
  },

  async me(): Promise<void> {
    const { data } = await api.get('/auth/me');
    const token = useAuthStore.getState().accessToken;
    if (token) {
      useAuthStore.getState().setAuth(data, token);
    }
  },
};