import React, { lazy, Suspense } from 'react'
const InventoryModal = lazy(() => import('../components/InventoryModal'))

const InventoryPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Inventario</h1>
      <Suspense fallback={<div className="p-8">Cargando inventario…</div>}>
        <InventoryModal isOpen={true} onClose={() => { window.history.back() }} isDarkMode={document.documentElement.classList.contains('dark')} />
      </Suspense>
    </div>
  )
}

export default InventoryPage


