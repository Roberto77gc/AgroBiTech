import React, { useState, useEffect } from 'react';
import { SubActivityRecord, ActivityRecord, ProductUsed } from '../types';
import { XCircle } from 'lucide-react';
import FertirriegoSection from './FertirriegoSection';
import { ToastContainer, toast } from 'react-toastify';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  initialData?: Partial<ActivityRecord> | null;
}

const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose, onSubmit, loading, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    cropType: '',
    variety: '',
    transplantDate: '',
    plantsCount: 0,
    surfaceArea: 0,
    waterUsed: 0,
    products: [] as ProductUsed[],
    sigpac: {
      refCatastral: '',
      poligono: '',
      parcela: '',
      recinto: ''
    },
    notes: '',
    fertirriego: [] as SubActivityRecord[],
  });

  // Estado para errores de validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Estado para errores de producto
  const [productErrors, setProductErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        cropType: initialData.cropType || '',
        variety: initialData.variety || '',
        transplantDate: initialData.transplantDate || '',
        plantsCount: initialData.plantsCount || 0,
        surfaceArea: initialData.surfaceArea || 0,
        waterUsed: initialData.waterUsed || 0,
        products: initialData.products || [],
        sigpac: initialData.sigpac || {
          refCatastral: '',
          poligono: '',
          parcela: '',
          recinto: ''
        },
        notes: initialData.notes || '',
        fertirriego: initialData.fertirriego || [],
      });
    } else {
      setFormData({
        name: '',
        cropType: '',
        variety: '',
        transplantDate: '',
        plantsCount: 0,
        surfaceArea: 0,
        waterUsed: 0,
        products: [],
        sigpac: {
          refCatastral: '',
          poligono: '',
          parcela: '',
          recinto: ''
        },
        notes: '',
        fertirriego: [],
      });
    }
  }, [initialData, isOpen]);

  const [newProduct, setNewProduct] = useState<ProductUsed>({
    name: '',
    dose: 0,
    pricePerUnit: 0,
    unit: 'kg',
    category: 'fertilizer'
  });

  const isProductValid = newProduct.name.trim() !== '' && newProduct.dose > 0 && newProduct.pricePerUnit > 0;

  const validateProduct = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newProduct.name.trim()) newErrors.name = 'El nombre del producto es obligatorio';
    if (newProduct.dose <= 0) newErrors.dose = 'La dosis debe ser mayor que 0';
    if (newProduct.pricePerUnit <= 0) newErrors.pricePerUnit = 'El precio debe ser mayor que 0';
    return newErrors;
  };

  const handleAddProduct = () => {
    const validationErrors = validateProduct();
    setProductErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { ...newProduct }]
    }));
    setNewProduct({
      name: '',
      dose: 0,
      pricePerUnit: 0,
      unit: 'kg',
      category: 'fertilizer'
    });
    setProductErrors({});
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.cropType.trim()) newErrors.cropType = 'El tipo de cultivo es obligatorio';
    if (!formData.variety.trim()) newErrors.variety = 'La variedad es obligatoria';
    if (formData.plantsCount <= 0) newErrors.plantsCount = 'El número de plantas debe ser mayor que 0';
    if (formData.surfaceArea <= 0) newErrors.surfaceArea = 'La superficie debe ser mayor que 0';
    if (formData.waterUsed < 0) newErrors.waterUsed = 'El agua usada no puede ser negativa';
    // Puedes añadir más validaciones según tu lógica
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (!formData.cropType || formData.surfaceArea <= 0) return;
    const totalProductCost = formData.products.reduce((sum, p) => sum + (p.dose * p.pricePerUnit), 0);
    const waterCost = formData.waterUsed * 0.5;
    const totalCost = totalProductCost + waterCost;
    const costPerHectare = formData.surfaceArea > 0 ? (totalCost * 10000) / formData.surfaceArea : 0;
    const payload = {
      ...formData,
      totalCost,
      costPerHectare,
      date: initialData && initialData.date ? initialData.date : new Date().toISOString().split('T')[0],
      location: initialData && initialData.location ? initialData.location : { lat: 40.4168, lng: -3.7038 },
      _id: initialData && initialData._id ? initialData._id : undefined,
      userId: initialData && initialData.userId ? initialData.userId : undefined,
    };
    // Simula guardado asíncrono y feedback visual
    setSaving(true);
    Promise.resolve(onSubmit(payload)).then(() => {
      toast.success('Actividad guardada correctamente');
      setSaving(false);
      setErrors({});
      if (!initialData) {
        setFormData({
          name: '',
          cropType: '',
          variety: '',
          transplantDate: '',
          plantsCount: 0,
          surfaceArea: 0,
          waterUsed: 0,
          products: [],
          sigpac: {
            refCatastral: '',
            poligono: '',
            parcela: '',
            recinto: ''
          },
          notes: '',
          fertirriego: [],
        });
      }
      onClose();
    }).catch(() => {
      toast.error('Error al guardar la actividad');
      setSaving(false);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl p-2 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-green-700">
            {initialData ? 'Editar Actividad' : 'Nueva Actividad'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Cerrar">
            <XCircle className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] sm:max-h-[70vh] space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nombre de la actividad</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tipo de cultivo</label>
            <input
              type="text"
              value={formData.cropType}
              onChange={e => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
              className="input-field"
            />
            {errors.cropType && <span className="text-red-500 text-xs">{errors.cropType}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Variedad</label>
            <input
              type="text"
              value={formData.variety}
              onChange={e => setFormData(prev => ({ ...prev, variety: e.target.value }))}
              className="input-field"
            />
            {errors.variety && <span className="text-red-500 text-xs">{errors.variety}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Número de plantas</label>
            <input
              type="number"
              value={formData.plantsCount}
              onChange={e => setFormData(prev => ({ ...prev, plantsCount: Number(e.target.value) }))}
              className="input-field"
            />
            {errors.plantsCount && <span className="text-red-500 text-xs">{errors.plantsCount}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Superficie (ha)</label>
            <input
              type="number"
              value={formData.surfaceArea}
              onChange={e => setFormData(prev => ({ ...prev, surfaceArea: Number(e.target.value) }))}
              className="input-field"
            />
            {errors.surfaceArea && <span className="text-red-500 text-xs">{errors.surfaceArea}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Agua usada (m³)</label>
            <input
              type="number"
              value={formData.waterUsed}
              onChange={e => setFormData(prev => ({ ...prev, waterUsed: Number(e.target.value) }))}
              className="input-field"
            />
            {errors.waterUsed && <span className="text-red-500 text-xs">{errors.waterUsed}</span>}
          </div>
          <div className="mt-6">
            <h4 className="font-bold mb-2">Fertirriego</h4>
            <FertirriegoSection
              registros={formData.fertirriego}
              setRegistros={registros => setFormData(f => ({ ...f, fertirriego: registros }))}
            />
          </div>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nombre del producto</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
              {productErrors.name && <span className="text-red-500 text-xs">{productErrors.name}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Dosis</label>
              <input
                type="number"
                value={newProduct.dose}
                onChange={e => setNewProduct(prev => ({ ...prev, dose: Number(e.target.value) }))}
                className="input-field"
              />
              {productErrors.dose && <span className="text-red-500 text-xs">{productErrors.dose}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Precio por unidad</label>
              <input
                type="number"
                value={newProduct.pricePerUnit}
                onChange={e => setNewProduct(prev => ({ ...prev, pricePerUnit: Number(e.target.value) }))}
                className="input-field"
              />
              {productErrors.pricePerUnit && <span className="text-red-500 text-xs">{productErrors.pricePerUnit}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Unidad</label>
              <select
                value={newProduct.unit}
                onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value as any }))}
                className="input-field"
              >
                <option value="kg">kg</option>
                <option value="l">l</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Categoría</label>
              <select
                value={newProduct.category}
                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value as any }))}
                className="input-field"
              >
                <option value="fertilizer">Fertilizante</option>
                <option value="pesticide">Pesticida</option>
                <option value="seed">Semilla</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="btn-primary w-full sm:w-auto mt-2 sm:mt-0"
            >
              Añadir producto
            </button>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`btn-primary flex items-center justify-center ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Guardando...
                </>
              ) : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
      {/* ToastContainer para mostrar mensajes de éxito y error */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default ActivityFormModal; 