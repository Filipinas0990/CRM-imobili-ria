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
    tipo_conta: 'corretor' | 'imobiliaria' | 'admin';
    role: 'owner' | 'member' | 'admin';
    organization_id: string | null;
    plano?: string;
    features_ativas?: string[];
    features_bloqueadas?: string[];
  };
}

interface FeaturesResponse {
  plano: string;
  features_ativas: string[];
  features_bloqueadas: string[];
}

async function carregarFeatures(token: string): Promise<Partial<FeaturesResponse>> {
  try {
    const { data } = await api.get<FeaturesResponse>('/me/features', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch {
    // Fallback: backend doc diz que basic só bloqueia whatsapp-ia
    return { features_bloqueadas: ['whatsapp-ia'] };
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<void> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    const features = await carregarFeatures(data.access_token);
    useAuthStore.getState().setAuth(
      { ...data.user, ...features },
      data.access_token,
    );
  },

  async register(payload: RegisterPayload): Promise<void> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    const features = await carregarFeatures(data.access_token);
    useAuthStore.getState().setAuth(
      { ...data.user, ...features },
      data.access_token,
    );
  },

  async logout(): Promise<void> {
    await api.delete('/auth/logout');
    useAuthStore.getState().clearAuth();
  },

  async me(): Promise<void> {
    const { data } = await api.get<AuthResponse['user']>('/auth/me');
    const token = useAuthStore.getState().accessToken;
    if (token) {
      const features = await carregarFeatures(token);
      useAuthStore.getState().setAuth({ ...data, ...features }, token);
    }
  },
};