import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

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
        const token = useAuthStore.getState().accessToken ?? data.access_token;

        const [{ data: user }, featuresResult] = await Promise.all([
          api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/me/features', { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.data)
            .catch(() => ({ features_bloqueadas: ['whatsapp-ia'] })),
        ]);

        if (cancelled) return;
        useAuthStore.getState().setAuth({ ...user, ...featuresResult }, token);
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