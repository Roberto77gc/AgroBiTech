import { useState, useEffect } from 'react';

export interface Movement {
  _id: string;
  type: string;
  product: {
    id: string;
    name: string;
    unit: string;
    category?: string;
  };
  quantity?: number;
  userId: string;
  userName?: string;
  date: string;
  notes?: string;
}

export function useMovementsHistory(userId: string | undefined, token: string | undefined) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !token) return;
    setLoading(true);
    setError(null);
    fetch(`/api/movements/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener historial');
        return res.json();
      })
      .then(data => setMovements(data.movements))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, token]);

  return { movements, loading, error };
} 