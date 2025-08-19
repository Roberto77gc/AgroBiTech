# AgroDigital — Project Overview

Este documento resume el alcance funcional y técnico del proyecto y sirve como base para compartir con stakeholders o exportar a PDF.

## 1. Visión y Objetivos
- Plataforma integral para pequeños y medianos agricultores.
- Control de gastos, gestión diaria y analítica accesible.
- Prioridad UX móvil, rendimiento y modo offline.

## 2. Módulos Principales
- Dashboard con KPIs, tendencias y filtros persistentes.
- Actividades con registros diarios: fertirriego, fitosanitarios, agua.
- Inventario: productos, stock, alertas y movimientos.
- Proveedores y compras integrados.
- Exportaciones CSV y reporte “PDF-like”.

## 3. UX y Productividad
- Selectores con búsqueda/paginación, recientes, navegación por teclado.
- Plantillas y “Usar último día” (local + backend).
- Autosave de borradores; indicador y limpieza rápida.
- Confirmaciones estilizadas y footers pegajosos en modales.

## 4. Cálculo de Costes y Unidades
- `utils/units.ts`: kg/g, L/ml/m³ (m³ por defecto en agua).
- `domain/costs.ts`: conversión unificada antes de calcular.
- Desgloses por categoría y totales diarios.

## 5. Rendimiento & Offline
- SmartCache (SWR) con TTL y revalidación en background.
- Batching de inventario para reducir latencia.
- Service Worker + IndexedDB para uso offline y sincronización.

## 6. Notificaciones
- Panel y reglas básicas (stock/costes/recordatorios).
- Integración con UI y eventos globales de API.

## 7. Arquitectura Técnica
- Frontend: React + Vite + TypeScript (hooks y componentes comunes).
- Backend: Express + TypeScript + Mongoose. Rutas bajo `/api/*`.
- Config frontend: `VITE_API_BASE_URL` (prod) o `http://localhost:3000/api` por defecto.

## 8. Integración y Entornos
- Dev: Frontend 5173, Backend 3000. Health en `/api/health`.
- Prod: Backend sirve el build del frontend (`npm run build && npm start`).

## 9. Pruebas Recomendadas
Revisa `docs/QA-Checklist.md` para un checklist detallado de QA manual.

## 10. Roadmap Corto
- Afinar reglas de notificaciones y métricas.
- Tests unitarios/integ. en costes, unidades y hooks.
- Accesibilidad y Web Vitals.

---
© AgroDigital — MVP 2025
