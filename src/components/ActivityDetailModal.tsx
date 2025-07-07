import React, { useEffect, useState } from "react";
import { XCircle } from 'lucide-react';

type ActivityFormValues = {
  cropType: string;
  plants: number;
  area: number;
  water: number;
  products: string;
  date: string;
  // ... otros campos si los hay ...
};

interface ActivityDetailModalProps {
  activity: any;
  onClose: () => void;
  onEdit?: (activity: any) => void;
  onDelete?: (activity: any) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, onClose, onEdit, onDelete }) => {
  const [form, setForm] = useState<ActivityFormValues>({
    cropType: "",
    plants: 0,
    area: 0,
    water: 0,
    products: "",
    date: "",
    // ... otros campos si los hay ...
  });

  useEffect(() => {
    if (activity) {
      setForm({
        cropType: activity.cropType || "",
        plants: activity.plantsCount || 0,
        area: activity.surfaceArea || 0,
        water: activity.waterUsed || 0,
        products: activity.products ? activity.products.map((p: { name: string }) => p.name).join(", ") : "",
        date: activity.date ? activity.date.slice(0, 10) : "",
        // ... otros campos si los hay ...
      });
    } else {
      setForm({
        cropType: "",
        plants: 0,
        area: 0,
        water: 0,
        products: "",
        date: "",
        // ... otros campos si los hay ...
      });
    }
  }, [activity]);

  if (!activity) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-6 w-full max-w-lg relative flex flex-col animate-slide-up mb-10"
        style={{ maxHeight: '80vh', minHeight: '300px' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <XCircle className="h-6 w-6" />
        </button>
        <h2 id="modal-title" className="text-2xl font-bold mb-4">{activity.cropType}</h2>
        <div className="flex-1 overflow-y-auto mb-6 pr-1">
          <p><strong>Fecha:</strong> {new Date(activity.date).toLocaleDateString()}</p>
          <p><strong>Superficie:</strong> {activity.surfaceArea} m²</p>
          <p><strong>Plantas:</strong> {activity.plantsCount}</p>
          <p><strong>Agua usada:</strong> {activity.waterUsed} m³</p>
          <p><strong>Coste total:</strong> €{activity.totalCost.toFixed(2)}</p>
          <p><strong>Coste/ha:</strong> €{activity.costPerHectare.toFixed(0)}</p>
          <p><strong>Productos usados:</strong></p>
          <ul className="ml-4 list-disc">
            {activity.products && activity.products.length > 0 ? (
              activity.products.map((prod: any, idx: number) => (
                <li key={idx}>
                  {prod.name} - {prod.dose} {prod.unit} - €{prod.pricePerUnit}/{prod.unit}
                </li>
              ))
            ) : (
              <li>No hay productos registrados</li>
            )}
          </ul>
          {activity.notes && <p className="mt-2"><strong>Notas:</strong> {activity.notes}</p>}
        </div>
        <div className="flex justify-end gap-4 pb-2">
          <button
            onClick={() => onEdit && onEdit(activity)}
            className="btn-secondary px-6 py-3 text-base rounded-lg"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete && onDelete(activity)}
            className="btn-danger px-6 py-3 text-base rounded-lg"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};