// Service Worker para AgroBiTech
const CACHE_NAME = 'agrobitech-v2'
const STATIC_CACHE = 'agrobitech-static-v2'
const DYNAMIC_CACHE = 'agrobitech-dynamic-v2'

// Archivos estáticos para cache
const STATIC_FILES = [
	'/',
	'/index.html',
	'/offline.html',
	'/manifest.json',
	'/favicon.ico',
	'/icons/icon-192x192.png',
	'/icons/icon-512x512.png'
]

// Evento de instalación
self.addEventListener('install', (event) => {
	console.log('Service Worker: Installing...')
	
	event.waitUntil(
		caches.open(STATIC_CACHE)
			.then((cache) => {
				console.log('Service Worker: Caching static files')
				return cache.addAll(STATIC_FILES)
			})
			.then(() => {
				console.log('Service Worker: Static files cached')
				return self.skipWaiting()
			})
	)
})

// Evento de activación
self.addEventListener('activate', (event) => {
	console.log('Service Worker: Activating...')
	
	event.waitUntil(
		caches.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
							console.log('Service Worker: Deleting old cache:', cacheName)
							return caches.delete(cacheName)
						}
					})
				)
			})
			.then(() => {
				console.log('Service Worker: Old caches cleaned')
				return self.clients.claim()
			})
	)
})

// Evento de fetch - Estrategia Cache First para archivos estáticos
self.addEventListener('fetch', (event) => {
	const { request } = event
	const url = new URL(request.url)

	// Solo cachear requests del mismo origen
	if (url.origin !== self.location.origin) {
		return
	}

	// Estrategia para archivos estáticos
	if (request.destination === 'style' || 
		request.destination === 'script' || 
		request.destination === 'image') {
		
		event.respondWith(
			caches.match(request)
				.then((response) => {
					if (response) {
						return response
					}
					
					return fetch(request)
						.then((fetchResponse) => {
							// Cachear la respuesta para futuras requests
							if (fetchResponse.status === 200) {
								const responseClone = fetchResponse.clone()
								caches.open(DYNAMIC_CACHE)
									.then((cache) => {
										cache.put(request, responseClone)
									})
							}
							return fetchResponse
						})
				})
		)
		return
	}

	// Estrategia para HTML - Network First con fallback a cache
	if (request.destination === 'document') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cachear la respuesta exitosa
					if (response.status === 200) {
						const responseClone = response.clone()
						caches.open(DYNAMIC_CACHE)
							.then((cache) => {
								cache.put(request, responseClone)
							})
					}
					return response
				})
				.catch(() => {
					// Fallback al cache si no hay conexión
					return caches.match(request)
						.then((cachedResponse) => {
							if (cachedResponse) {
								return cachedResponse
							}
							// Fallback a la página offline
							return caches.match('/offline.html')
						})
				})
		)
		return
	}

	// Estrategia para API calls - Network First
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cachear respuestas exitosas de la API
					if (response.status === 200) {
						const responseClone = response.clone()
						caches.open(DYNAMIC_CACHE)
							.then((cache) => {
								cache.put(request, responseClone)
							})
					}
					return response
				})
				.catch(() => {
					// Fallback al cache para API calls
					return caches.match(request)
				})
		)
		return
	}
})

// Evento de push - Manejar notificaciones push
self.addEventListener('push', (event) => {
	console.log('Service Worker: Push event received:', event)
	
	if (!event.data) {
		console.log('Service Worker: No data received')
		return
	}

	try {
		const data = event.data.json()
		console.log('Service Worker: Push data:', data)
		
		const options = {
			body: data.body || 'Nueva notificación de AgroBiTech',
			icon: data.icon || '/icons/icon-192x192.png',
			badge: data.badge || '/icons/icon-192x192.png',
			tag: data.tag || 'agrobitech-notification',
			data: data.data || {},
			actions: data.actions || [],
			requireInteraction: true,
			silent: false,
			vibrate: [200, 100, 200]
		}

		event.waitUntil(
			self.registration.showNotification(data.title || 'AgroBiTech', options)
		)
	} catch (error) {
		console.error('Service Worker: Error parsing push data:', error)
		
		// Fallback notification
		const options = {
			body: 'Nueva notificación de AgroBiTech',
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-192x192.png',
			tag: 'agrobitech-notification',
			requireInteraction: true,
			silent: false
		}

		event.waitUntil(
			self.registration.showNotification('AgroBiTech', options)
		)
	}
})

// Evento de click en notificación
self.addEventListener('notificationclick', (event) => {
	console.log('Service Worker: Notification clicked:', event)
	
	event.notification.close()
	
	if (event.action) {
		console.log('Service Worker: Action clicked:', event.action)
		
		// Manejar acciones específicas
		switch (event.action) {
			case 'view-inventory':
				event.waitUntil(
					self.clients.openWindow('/inventory')
				)
				break
			case 'view-activity':
				event.waitUntil(
					self.clients.openWindow('/activity')
				)
				break
			case 'view-schedule':
				event.waitUntil(
					self.clients.openWindow('/schedule')
				)
				break
			case 'order-now':
				event.waitUntil(
					self.clients.openWindow('/suppliers')
				)
				break
			default:
				// Acción por defecto - abrir la app
				event.waitUntil(
					self.clients.openWindow('/')
				)
		}
	} else {
		// Click en la notificación principal - abrir la app
		event.waitUntil(
			self.clients.openWindow('/')
		)
	}
})

// Evento de cierre de notificación
self.addEventListener('notificationclose', (event) => {
	console.log('Service Worker: Notification closed:', event)
	
	// Aquí podrías enviar analytics sobre el cierre de notificaciones
	// Por ejemplo, para medir engagement
})

// Evento de sync en background
self.addEventListener('sync', (event) => {
	console.log('Service Worker: Background sync event:', event.tag)
	
	if (event.tag === 'background-sync') {
		event.waitUntil(syncData())
	} else if (event.tag === 'sync-inventory') {
		event.waitUntil(syncInventoryData())
	} else if (event.tag === 'sync-activities') {
		event.waitUntil(syncActivitiesData())
	} else if (event.tag === 'sync-products') {
		event.waitUntil(syncProductsData())
	} else if (event.tag === 'sync-offline-data') {
		event.waitUntil(syncData())
	}
})

// Función para sincronizar datos
async function syncData() {
	try {
		// Obtener datos del IndexedDB o cache
		const offlineData = await getOfflineData()
		
		if (offlineData && offlineData.length > 0) {
			console.log('Service Worker: Syncing offline data:', offlineData.length, 'items')
			
			// Enviar datos al servidor
			const API_BASE = 'http://localhost:3000/api'
			for (const data of offlineData) {
				try {
					await fetch(`${API_BASE}/sync`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(data)
					})
					
					// Marcar como sincronizado
					await markDataAsSynced(data.id)
				} catch (error) {
					console.error('Service Worker: Failed to sync data:', error)
				}
			}
		}
	} catch (error) {
		console.error('Service Worker: Error during background sync:', error)
	}
}

// Función para obtener datos offline (placeholder)
async function getOfflineData() {
	// Aquí implementarías la lógica para obtener datos del IndexedDB
	// Por ahora retornamos un array vacío
	return []
}

// Funciones específicas de sincronización por tipo de dato
async function syncInventoryData() {
	try {
		console.log('Service Worker: Syncing inventory data...')
		// Implementar sincronización específica de inventario
		await syncData()
	} catch (error) {
		console.error('Service Worker: Error syncing inventory:', error)
	}
}

async function syncActivitiesData() {
	try {
		console.log('Service Worker: Syncing activities data...')
		// Implementar sincronización específica de actividades
		await syncData()
	} catch (error) {
		console.error('Service Worker: Error syncing activities:', error)
	}
}

async function syncProductsData() {
	try {
		console.log('Service Worker: Syncing products data...')
		// Implementar sincronización específica de productos
		await syncData()
	} catch (error) {
		console.error('Service Worker: Error syncing products:', error)
	}
}

// Función para marcar datos como sincronizados (placeholder)
async function markDataAsSynced(id) {
	// Aquí implementarías la lógica para marcar datos como sincronizados
	console.log('Service Worker: Marking data as synced:', id)
}

// Mensaje del cliente principal
self.addEventListener('message', (event) => {
	console.log('Service Worker: Message received:', event.data)
	
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting()
	}
	
	if (event.data && event.data.type === 'GET_VERSION') {
		event.ports[0].postMessage({ version: CACHE_NAME })
	}
})

console.log('Service Worker: Loaded successfully')
