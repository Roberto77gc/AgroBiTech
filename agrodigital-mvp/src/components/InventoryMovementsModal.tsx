import React, { useEffect, useState, useRef } from 'react'
import { inventoryAPI } from '../services/api'
import { Package, Filter, X, ExternalLink } from 'lucide-react'
import { useToast } from './ui/ToastProvider'
import { useNavigate } from 'react-router-dom'

interface InventoryMovementsModalProps {
  isOpen: boolean
  onClose: () => void
  activityId?: string
  productId?: string
  isDarkMode: boolean
}

const InventoryMovementsModal: React.FC<InventoryMovementsModalProps> = ({ isOpen, onClose, activityId, productId, isDarkMode }) => {
  const { error: toastError } = useToast()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<{ productId?: string; activityId?: string; module?: string; from?: string; to?: string }>({ productId, activityId })
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.productId) params.set('productId', filters.productId)
      if (filters.activityId) params.set('activityId', filters.activityId)
      if (filters.module) params.set('module', filters.module)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      const res = await inventoryAPI.listMovements(params.toString())
      setItems(res.items || [])
    } catch (e) {
      toastError('No se pudieron cargar los movimientos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { if (isOpen) { try { headingRef.current?.focus() } catch {} } }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const container = modalRef.current
      if (!container) return
      const focusable = container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) { if (active === first) { e.preventDefault(); last.focus() } }
      else { if (active === last) { e.preventDefault(); first.focus() } }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="inventory-movements-title" ref={modalRef}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full max-w-4xl mx-4 rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-500" />
            <h3 id="inventory-movements-title" ref={headingRef} tabIndex={-1} className="font-semibold">Movimientos de Inventario</h3>
          </div>
          <button onClick={onClose} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SR announcements */}
        <div className="sr-only" aria-live="polite"></div>

        <div className="p-4 space-y-4">
          {/* Filtros */}
          <div className={`p-3 rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div>
                <label className="text-xs opacity-70">Producto (ID)</label>
                <input value={filters.productId || ''} onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))} className={`w-full px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} placeholder="productId" />
              </div>
              <div>
                <label className="text-xs opacity-70">Actividad (ID)</label>
                <input value={filters.activityId || ''} onChange={e => setFilters(f => ({ ...f, activityId: e.target.value }))} className={`w-full px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} placeholder="activityId" />
              </div>
              <div>
                <label className="text-xs opacity-70">Módulo</label>
                <select value={filters.module || ''} onChange={e => setFilters(f => ({ ...f, module: e.target.value || undefined }))} className={`w-full px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <option value="">Todos</option>
                  <option value="fertigation">Fertirriego</option>
                  <option value="phytosanitary">Fitosanitarios</option>
                  <option value="water">Agua</option>
                </select>
              </div>
              <div>
                <label className="text-xs opacity-70">Desde</label>
                <input type="date" value={filters.from || ''} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className={`w-full px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
              </div>
              <div>
                <label className="text-xs opacity-70">Hasta</label>
                <input type="date" value={filters.to || ''} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className={`w-full px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={fetchItems} className="px-3 py-1 bg-blue-600 text-white rounded flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtrar</span>
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {loading && <div className="text-sm opacity-70">Cargando...</div>}
            {!loading && items.length === 0 && <div className="text-sm opacity-70">Sin movimientos</div>}
            {!loading && items.map((m, idx) => (
              <div key={idx} className={`p-3 rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs ${m.operation === 'subtract' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
                        {m.operation === 'subtract' ? 'Salida' : 'Entrada'}
                      </span>
                      <span className="ml-2 opacity-80">{new Date(m.createdAt).toLocaleString('es-ES')}</span>
                    </div>
                    <div className="mt-1">
                      {m.productName || m.productId} — {m.amount} {m.unit} (={m.amountInItemUnit} en {m.unit !== m.amountInItemUnit ? 'unidad item' : m.unit})
                    </div>
                    <div className="text-xs opacity-80">
                      Saldo tras movimiento: {m.balanceAfter} {m.unit}
                    </div>
                    {m.activityId && (
                      <div className="text-xs opacity-80">
                        Actividad: {m.activityId} · Módulo: {m.module} · Día: {m.dayIndex ?? '-'}
                      </div>
                    )}
                  </div>
                  {m.productId && (
                    <button onClick={() => navigate(`/inventario?productId=${m.productId}`)} className="text-blue-600 hover:underline flex items-center text-sm">
                      <ExternalLink className="w-4 h-4 mr-1" /> Abrir inventario
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryMovementsModal


