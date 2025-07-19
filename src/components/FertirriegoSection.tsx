import React, { useState, useEffect } from 'react';
import { SubActivityRecord, ProductUsed } from '../types';

interface FertirriegoSectionProps {
  registros: SubActivityRecord[];
  setRegistros: (registros: SubActivityRecord[]) => void;
}

const FertirriegoSection: React.FC<FertirriegoSectionProps> = ({ registros, setRegistros }) => {
  const [registro, setRegistro] = useState<SubActivityRecord>({
    date: '',
    productos: [],
    observaciones: '',
    coste: 0,
  });

  useEffect(() => {
    const coste = registro.productos.reduce(
      (sum, p) => sum + (p.dose * p.pricePerUnit),
      0
    );
    setRegistro(r => ({ ...r, coste }));
  }, [registro.productos]);

  const handleAdd = () => {
    if (!registro.date) return;
    setRegistros([...registros, { ...registro }]);
    setRegistro({ date: '', productos: [], observaciones: '', coste: 0 });
  };

  const handleDelete = (idx: number) => {
    setRegistros(registros.filter((_, i) => i !== idx));
  };

  return (
    <div className="border rounded p-4 bg-gray-50 dark:bg-gray-800 mb-4">
      <div className="flex gap-2 mb-2">
        <input
          type="date"
          value={registro.date}
          onChange={e => setRegistro(r => ({ ...r, date: e.target.value }))}
          className="input-field"
        />
        <input
          type="text"
          value={registro.observaciones || ''}
          onChange={e => setRegistro(r => ({ ...r, observaciones: e.target.value }))}
          className="input-field"
          placeholder="Observaciones"
        />
        {/* Aquí podrías añadir inputs para productos, pero para el ejemplo lo dejamos simple */}
        <button onClick={handleAdd} className="btn-primary">Añadir</button>
      </div>
      <ul>
        {registros.map((r, idx) => (
          <li key={idx} className="border-b py-2 flex justify-between items-center">
            <span>
              {r.date} - {r.coste}€ - {r.productos.map(p => p.name).join(', ')}
            </span>
            <button onClick={() => handleDelete(idx)} className="text-red-500 ml-2">Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FertirriegoSection; 