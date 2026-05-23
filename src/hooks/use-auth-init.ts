import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const BLOQUEADAS_POR_PLANO: Record<string, string[]> = {
  basic: ['relatorios', 'whatsapp', 'whatsapp-ia', 'automacoes', 'campanhas'],
  premium: [],
  gold: [],
};

function resolverFeaturesBloqueadas(user: any): string[] {
  if (Array.isArray(user.features_bloqueadas)) return user.features_bloqueadas;
  if (user.plano) return BLOQUEADAS_POR_PLANO[user.plano] ?? [];
  return [];
}

export function useAuthInit() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const store = useAuthStore.getState();

    if (store.accessToken) {
      setIsLoading(false);
      return;
    }

    api.post<{ access_token: string }>('/auth/refresh')
      .then(async ({ data }) => {
        if (cancelled) return;
        const { data: user } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (cancelled) return;
        const token = useAuthStore.getState().accessToken ?? data.access_token;
        const userComFeatures = {
          ...user,
          features_bloqueadas: resolverFeaturesBloqueadas(user),
        };
        useAuthStore.getState().setAuth(userComFeatures, token);
      })
      .catch(() => {
        if (cancelled) return;
        if (!useAuthStore.getState().accessToken) {
          useAuthStore.getState().clearAuth();
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading };
}