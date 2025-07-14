import React, { useEffect, useRef, useState } from 'react';
import { InventoryProduct } from '../types';

interface InventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (product: Partial<InventoryProduct>) => void;
  initialData?: Partial<InventoryProduct>;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ visible, onClose, onSave, initialData }) => {
  const [form, setForm] = useState<Partial<InventoryProduct>>({});
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(initialData || {});
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!form.name || !form.unit || !form.category || form.quantity === undefined) return;
    onSave({ ...form, quantity: Number(form.quantity) });
    setForm({});
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{form.id ? 'Editar producto' : 'Añadir producto'}</h3>
        <div className="space-y-4">
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Nombre"
            value={form.name || ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => {
              if (e.key === "Enter") {
                quantityInputRef.current?.focus();
              }
            }}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            ref={quantityInputRef}
            type="number"
            placeholder="Cantidad"
            value={form.quantity || ''}
            onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          />
          <select
            className="input-field mb-2"
            value={form.unit || ''}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value as InventoryProduct['unit'] }))}
          >
            <option value="">Unidad</option>
            <option value="kg">kg</option>
            <option value="l">l</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
          </select>
          <select
            className="input-field mb-3"
            value={form.category || ''}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as InventoryProduct['category'] }))}
          >
            <option value="">Categoría</option>
            <option value="fertilizer">Fertilizante</option>
            <option value="pesticide">Fitosanitario</option>
            <option value="seed">Semilla</option>
            <option value="other">Otro</option>
          </select>
          <label className="block text-gray-700 dark:text-gray-100 mb-2">Stock mínimo:</label>
          <input
            type="number"
            value={form.minStock || ''}
            onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))}
            className="input-field"
            min={0}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} className="btn-danger">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 