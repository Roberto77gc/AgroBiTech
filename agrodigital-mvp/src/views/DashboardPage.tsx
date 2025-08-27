import React, { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('../components/Dashboard'))

const DashboardPage: React.FC = () => {
  // Delegamos al componente existente
  return (
    <Suspense fallback={<div className="p-8">Cargando…</div>}>
      <Dashboard />
    </Suspense>
  )
}

export default DashboardPage


