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

export function useMovementsHistory(token: string | undefined) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      console.log('No hay token, no se hace fetch');
      return;
    }
    console.log('Ejecutando fetch a /api/movements con token:', token);

    setLoading(true);
    setError(null);

    fetch('/api/movements', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then((data) => {
        setMovements(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        console.error('Error en fetch:', err); // <-- Agrega este log
      });
  }, [token]);

  return { movements, loading, error };
} 