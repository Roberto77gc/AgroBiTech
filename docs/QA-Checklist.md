# QA Checklist — AgroDigital

## Autenticación
- [ ] Registro con datos válidos.
- [ ] Login con usuario existente.
- [ ] Validación de token tras recarga.
- [ ] Logout limpia token y vuelve a login.

## Dashboard
- [ ] Carga de métricas y KPIs.
- [ ] Filtros persistentes (búsqueda/orden).
- [ ] Panel de notificaciones visible.

## Actividades
- [ ] Crear actividad con datos mínimos.
- [ ] Añadir día de fertirriego (m³ por defecto) y verificar totales.
- [ ] Añadir día de fitosanitarios y verificar totales.
- [ ] Añadir día de agua y verificar coste.
- [ ] Duplicar línea, borrar línea con confirmación estilizada.
- [ ] Exportar CSV y PDF-like.
- [ ] Usar Plantilla y “Último día”.

## Inventario
- [ ] Alta/edición/borrado de producto.
- [ ] Ajuste de stock (add/subtract) y movimientos listados.
- [ ] Alertas de stock (ok/low/critical) visibles.

## Proveedores y Compras
- [ ] Alta/edición/borrado de proveedor.
- [ ] Alta/edición/borrado de compra.
- [ ] Enlazar compra con producto y ver precio.

## Selectores y UX
- [ ] Búsqueda con debounce, paginación y resaltado.
- [ ] Navegación por teclado en `ProductSelect`.
- [ ] Botones de “recientes”.

## Offline
- [ ] Desconectar red: crear cambios sin conexión.
- [ ] Reconectar: sincronización automática completada.

## Exportaciones
- [ ] CSV se descarga con encabezados correctos.
- [ ] PDF-like contiene fecha, actividad y detalles.

## Service Worker
- [ ] SW activado (DevTools → Application → Service Workers).
- [ ] Tras cambio de `sw.js`, “Unregister” y recarga.

## Errores y Logs
- [ ] Toasters en errores 4xx/5xx.
- [ ] Eventos `app:api-error`/`app:data-changed` emitidos.

---
Pruebas mínimas para release y regresión rápida.
