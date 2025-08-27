import React, { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'

const DashboardPage = lazy(() => import('../views/DashboardPage'))
const ActivitiesPage = lazy(() => import('../views/ActivitiesPage'))
const ActivityNewPage = lazy(() => import('../views/ActivityNewPage'))
const InventoryPage = lazy(() => import('../views/InventoryPage'))
const AnalyticsPage = lazy(() => import('../views/AnalyticsPage'))
const SettingsPage = lazy(() => import('../views/SettingsPage'))

interface AppRoutesProps {
  logout: () => void
}

const AppRoutes: React.FC<AppRoutesProps> = ({ logout }) => {
  return (
    <Routes>
      <Route element={<AppLayout logout={logout} />}> 
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/new" element={<ActivityNewPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes


