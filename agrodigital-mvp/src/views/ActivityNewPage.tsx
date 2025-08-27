import React, { lazy, Suspense } from 'react'
const ActivityFormModal = lazy(() => import('../components/ActivityFormModal'))

const ActivityNewPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Nueva Actividad</h1>
      <Suspense fallback={<div className="p-8">Cargando formulario…</div>}>
        <ActivityFormModal isOpen={true} onClose={() => { window.history.back() }} onSubmit={async () => {}} isDarkMode={document.documentElement.classList.contains('dark')} />
      </Suspense>
    </div>
  )
}

export default ActivityNewPage


