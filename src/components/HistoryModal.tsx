import React from 'react';
import { useMovementsHistory, Movement } from '../hooks/useMovementsHistory';

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  token: string;
}

const typeLabels: Record<string, string> = {
  alta: 'Alta',
  edicion: 'Edición',
  baja: 'Baja',
  entrada: 'Entrada',
  salida: 'Salida',
};

export const HistoryModal: React.FC<HistoryModalProps> = ({ open, onClose, userId, token }) => {
  const { movements, loading, error } = useMovementsHistory(userId, token);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative max-h-[80vh] flex flex-col">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          aria-label="Cerrar historial"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Historial de movimientos</h2>
        {loading && <p>Cargando historial...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && movements.length === 0 && <p>No hay movimientos registrados.</p>}
        {!loading && !error && movements.length > 0 && (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto flex-1">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">Fecha</th>
                  <th className="px-2 py-1 border">Tipo</th>
                  <th className="px-2 py-1 border">Producto</th>
                  <th className="px-2 py-1 border">Unidad</th>
                  <th className="px-2 py-1 border">Categoría</th>
                  <th className="px-2 py-1 border">Cantidad</th>
                  <th className="px-2 py-1 border">Usuario</th>
                  <th className="px-2 py-1 border">Notas</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m: Movement) => (
                  <tr key={m._id}>
                    <td className="px-2 py-1 border">{new Date(m.date).toLocaleString()}</td>
                    <td className="px-2 py-1 border">{typeLabels[m.type] || m.type}</td>
                    <td className="px-2 py-1 border">{m.product.name}</td>
                    <td className="px-2 py-1 border">{m.product.unit}</td>
                    <td className="px-2 py-1 border">{m.product.category || '-'}</td>
                    <td className="px-2 py-1 border">{m.quantity !== undefined ? m.quantity : '-'}</td>
                    <td className="px-2 py-1 border">{m.userName || '-'}</td>
                    <td className="px-2 py-1 border">{m.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
