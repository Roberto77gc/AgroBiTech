import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react'

export interface Notification {
	id: string
	type: 'info' | 'warning' | 'error' | 'success'
	title: string
	message: string
	timestamp: number
	read: boolean
	dismissible: boolean
	action?: {
		label: string
		onClick: () => void
	}
}

interface NotificationSystemProps {
	className?: string
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ className = '' }) => {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [unreadCount, setUnreadCount] = useState(0)

	// Load notifications from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem('agrodigital:notifications')
			if (saved) {
				const parsed = JSON.parse(saved) as Notification[]
				setNotifications(parsed)
				setUnreadCount(parsed.filter(n => !n.read).length)
			}
		} catch (error) {
			console.warn('Could not load notifications from localStorage')
		}
	}, [])

	// Save notifications to localStorage
	useEffect(() => {
		try {
			localStorage.setItem('agrodigital:notifications', JSON.stringify(notifications))
			setUnreadCount(notifications.filter(n => !n.read).length)
		} catch (error) {
			console.warn('Could not save notifications to localStorage')
		}
	}, [notifications])

	// Add new notification
	const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
		const newNotification: Notification = {
			...notification,
			id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
			read: false
		}
		
		setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep max 50 notifications
		
		// Auto-dismiss success notifications after 5 seconds
		if (notification.type === 'success') {
			setTimeout(() => {
				dismissNotification(newNotification.id)
			}, 5000)
		}
	}, [])

	// Mark notification as read
	const markAsRead = useCallback((id: string) => {
		setNotifications(prev => 
			prev.map(n => n.id === id ? { ...n, read: true } : n)
		)
	}, [])

	// Dismiss notification
	const dismissNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id))
	}, [])

	// Mark all as read
	const markAllAsRead = useCallback(() => {
		setNotifications(prev => prev.map(n => ({ ...n, read: true })))
	}, [])

	// Clear all notifications
	const clearAll = useCallback(() => {
		setNotifications([])
	}, [])

	// Get icon for notification type
	const getNotificationIcon = (type: Notification['type']) => {
		switch (type) {
			case 'info': return <Info className="h-5 w-5 text-blue-500" />
			case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
			case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />
			case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
			default: return <Info className="h-5 w-5 text-gray-500" />
		}
	}

	// Get background color for notification type
	const getNotificationBgColor = (type: Notification['type']) => {
		switch (type) {
			case 'info': return 'bg-blue-50 border-blue-200'
			case 'warning': return 'bg-yellow-50 border-yellow-200'
			case 'error': return 'bg-red-50 border-red-200'
			case 'success': return 'bg-green-50 border-green-200'
			default: return 'bg-gray-50 border-gray-200'
		}
	}

	// Format timestamp
	const formatTimestamp = (timestamp: number) => {
		const now = Date.now()
		const diff = now - timestamp
		
		if (diff < 60000) return 'Ahora'
		if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
		return new Date(timestamp).toLocaleDateString('es-ES')
	}

	return (
		<div className={`relative ${className}`}>
			{/* Notification Bell */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
			>
				<Bell className="h-6 w-6" />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{/* Notifications Panel */}
			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							Notificaciones
						</h3>
						<div className="flex gap-2">
							<button
								onClick={markAllAsRead}
								className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							>
								Marcar leídas
							</button>
							<button
								onClick={clearAll}
								className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
							>
								Limpiar
							</button>
						</div>
					</div>

					{/* Notifications List */}
					<div className="overflow-y-auto max-h-80">
						{notifications.length === 0 ? (
							<div className="p-6 text-center text-gray-500 dark:text-gray-400">
								<Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
								<p>No hay notificaciones</p>
							</div>
						) : (
							<div className="divide-y divide-gray-200 dark:divide-gray-700">
								{notifications.map((notification) => (
									<div
										key={notification.id}
										className={`p-4 border-l-4 ${getNotificationBgColor(notification.type)} ${
											!notification.read ? 'border-l-4' : 'border-l-2'
										}`}
									>
										<div className="flex items-start gap-3">
											{getNotificationIcon(notification.type)}
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between">
													<h4 className={`text-sm font-medium ${
														!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
													}`}>
														{notification.title}
													</h4>
													<div className="flex items-center gap-2">
														<span className="text-xs text-gray-500 dark:text-gray-400">
															{formatTimestamp(notification.timestamp)}
														</span>
														{notification.dismissible && (
															<button
																onClick={() => dismissNotification(notification.id)}
																className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
															>
																<X className="h-4 w-4" />
															</button>
														)}
													</div>
												</div>
												<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
													{notification.message}
												</p>
												{notification.action && (
													<button
														onClick={() => {
															notification.action!.onClick()
															markAsRead(notification.id)
														}}
														className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
													>
														{notification.action.label}
													</button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Click outside to close */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setIsOpen(false)}
				/>
			)}
		</div>
	)
}

// Export the addNotification function for use in other components
export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
	// This will be called by the notification context
	window.dispatchEvent(new CustomEvent('agrodigital:add-notification', { 
		detail: notification 
	}))
}

export default NotificationSystem
