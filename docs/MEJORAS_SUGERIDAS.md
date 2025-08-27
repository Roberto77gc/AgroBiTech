## Objetivo

Dejar AgroDigital lista para un uso sencillo por agricultores, manteniendo toda la potencia (KPI, inventario, compras, actividades, SIGPAC), con una interfaz clara, móvil primero, y secciones bien separadas. Este documento propone arquitectura, UX, responsive, backend y marketing/SEO, además de un backlog por fases.

## Arquitectura de navegación (IA)

- **Dashboard (resumen)**: tarjetas “Hoy”, coste acumulado, alertas de stock, próximos tratamientos; acciones rápidas.
- **Actividades**: listado filtrable por ciclo/estado; detalle en página; creación como asistente de 3 pasos.
- **Inventario**: stock, movimientos, estados OK/Bajo/Crítico; registrar compra; consumir en actividad.
- **Compras y Proveedores**: compras recientes, proveedores, KPIs de coste por proveedor.
- **Analítica/KPIs**: €/ha por cultivo/ciclo, agua/energía por ha, tendencias temporales.
- **Plantillas**: recetas por cultivo/fase (fertirriego/fitosanitario) reutilizables.
- **Ajustes**: unidades por defecto, notificaciones, tema, integraciones.

## Reorganización técnica (frontend)

- **Rutas**: `/dashboard`, `/activities`, `/activities/new`, `/activities/:id`, `/inventory`, `/purchases`, `/analytics`, `/templates`, `/settings`.
- **Navegación adaptable**:
  - Móvil: barra inferior táctil (usa `TouchNavigation`) conectada al router.
  - Desktop: sidebar izquierda + topbar simple con acciones rápidas.
- **Modales → páginas**: mover formularios pesados a páginas (inventario, compras, proveedores, nueva actividad) para reducir complejidad del Dashboard.
- **Dividir `Dashboard`** en tarjetas autocontenidas (sin lógica cruzada), con lazy-loading por ruta.

## UX/UI: simplificación y enfoque agrícola

- **Wizard de actividad (3 pasos)**:
  - Paso 1: básicos (nombre, cultivo, extensión, fechas).
  - Paso 2: recursos (fertirriego/fitosanitario/agua/energía) con plantillas y autocompletado por última compra.
  - Paso 3: revisión (coste total, consumos) y guardar.
- **Plantillas por cultivo/fenología**: predefinidos por fase, dosis y unidades; editable.
- **Estados claros**: badges de estado y prioridad; acciones principales visibles (crear, registrar compra, ver inventario).
- **Mensajes de error útiles**: al lado del campo, breves y específicos; accesibles (aria-live).
- **Empty states con CTA**: “No hay actividades hoy → Crear actividad”.

## Responsive (móvil primero)

- Móvil: tarjetas con densidad baja, botones grandes, navegación inferior fija.
- Tablet/desktop: dos/tres columnas; tablas con sticky header y filtros a la izquierda.
- Tablas → tarjetas en móvil; gráficas con scroll horizontal.

## Funciones agronómicas priorizadas

- **Registro legal de tratamientos**: fecha, producto, dosis, lote, proveedor, condiciones, operario.
- **Umbrales y alertas**: stock mínimo/ crítico (push/email opcional) y sugerencia de reponer a proveedor habitual.
- **KPIs agrícolas**: €/ha por ciclo, agua/energía por ha, reparto de costes por cultivo/actividad; ratio fitosanitario por producción (cuando haya ventas).
- **SIGPAC**: referencia visible en actividades/ciclos; filtrado por parcela.

## Rendimiento y fiabilidad

- **Service Worker solo en producción** y estrategia: estáticos cache-first versionados; API network-first con fallback.
- **Code-splitting por ruta** y lazy para vistas pesadas.
- **Gestión de errores**: vistas de error por página; reintentos en `/dashboard`.
- **Métricas**: tiempos y errores por endpoint (opcional Sentry/LogRocket).

## Backend y datos

- **Ajuste de inventario en el backend** al crear actividad (con `consumedProducts`), operación atómica e idempotente.
- **Corregir advertencias de índices Mongoose** (duplicados).
- **Exportación**: PDF/CSV de stock, compras y actividades.
- **Permisos/roles** (futuro): owner/worker por explotación.

## Marketing, SEO/SEM y landing

- **Landing pública** separada de la app SPA: casos de uso, testimonios, pricing, contacto.
- **SEO técnico**: Schema.org (Product/SoftwareApplication), OG/Twitter, sitemap, robots, i18n si aplica.
- **Palabras clave**: “gestión agrícola”, “control de costes agrícolas”, “registro fertirriego”, “registro fitosanitarios”, “SIGPAC”.
- **Captación**: plantilla Excel gratuita a cambio de email (Mailchimp/Brevo), onboarding por email.

## Backlog por fases

- **P0 (estructura y valor inmediato)**
  
  - Wizard de actividad (3 pasos) con autoguardado en borrador.
  - Página de inventario: estados, movimientos, registrar compra.
  - Ajuste de inventario en backend al crear actividad.
- **P1 (analítica y plantillas)**
  - Página de KPIs con rango temporal y exportación CSV.
  - CRUD de plantillas por cultivo/fase e inserción en wizard.
  - Accesibilidad (foco, teclado) y preparación de i18n.
- **P2 (marketing y crecimiento)**
  - Nueva landing, SEO técnico, newsletter, “Instalar app” contextual.
  - Sentry/telemetría ligera.

## Criterios de éxito (medibles)

- Tiempo medio para crear una actividad < 60s en móvil.
- Reducción de errores en formularios (>30%).
- Incremento de uso de inventario/compras (>40% sesiones activas lo usan/semana).
- Tasa de instalación PWA > 15% usuarios recurrentes.

## Riesgos y mitigaciones

- Formularios largos → wizard y plantillas; autocompletado por última compra.
- Interfaz densa → separar en secciones; vaciar Dashboard a “resumen + CTA”.
- Stock inconsistente → ajuste en backend con transacción/log de movimientos.
- Conectividad variable → SW adecuado, fallback y reintentos.

## Siguientes pasos

1) Aprobar IA y mapa de navegación.
2) Implementar rutas/layout y mover modales a páginas.
3) Construir wizard de actividad + plantillas.
4) Mover ajuste de inventario al backend y cerrar ciclo de datos.
5) Entregar landing y plan SEO/SEM.


