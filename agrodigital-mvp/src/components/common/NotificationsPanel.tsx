import React, { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

interface NotificationsPanelProps {
	isOpen: boolean
	onClose: () => void
	className?: string
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
	isOpen, 
	onClose, 
	className = '' 
}) => {
	const [activeTab, setActiveTab] = useState<'notifications' | 'rules'>('notifications')
	const {
		notifications,
		rules,
		isEnabled,
		requestPermission,
		markAsRead,
		markAllAsRead,
		removeNotification,
		clearAll,
		updateRule,
		unreadCount
	} = useNotifications()

	if (!isOpen) return null

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'info': return 'ℹ️'
			case 'warning': return '⚠️'
			case 'error': return '❌'
			case 'success': return '✅'
			default: return '📢'
		}
	}

	const getNotificationColor = (type: string) => {
		switch (type) {
			case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
			case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
			case 'error': return 'border-red-200 bg-red-50 dark:bg-red-900/20'
			case 'success': return 'border-green-200 bg-green-50 dark:bg-green-900/20'
			default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden ${className}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
							Notificaciones
						</h2>
						{unreadCount > 0 && (
							<span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
								{unreadCount}
							</span>
						)}
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						✕
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200 dark:border-gray-700">
					<button
						onClick={() => setActiveTab('notifications')}
						className={`px-6 py-3 text-sm font-medium transition-colors ${
							activeTab === 'notifications'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
						}`}
					>
						Notificaciones ({notifications.length})
					</button>
					<button
						onClick={() => setActiveTab('rules')}
						className={`px-6 py-3 text-sm font-medium transition-colors ${
							activeTab === 'rules'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
						}`}
					>
						Reglas ({rules.length})
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[60vh]">
					{activeTab === 'notifications' ? (
						<div className="space-y-4">
							{/* Permission Status */}
							{!isEnabled && (
								<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
									<div className="flex items-center gap-3">
										<div className="text-yellow-600 dark:text-yellow-400">🔔</div>
										<div>
											<div className="font-medium text-yellow-800 dark:text-yellow-200">
												Notificaciones del navegador deshabilitadas
											</div>
											<div className="text-sm text-yellow-700 dark:text-yellow-300">
												Habilita las notificaciones para recibir alertas importantes
											</div>
										</div>
										<button
											onClick={requestPermission}
											className="ml-auto bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700"
										>
											Habilitar
										</button>
									</div>
								</div>
							)}

							{/* Actions */}
							{notifications.length > 0 && (
								<div className="flex gap-2">
									<button
										onClick={markAllAsRead}
										className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
									>
										Marcar todas como leídas
									</button>
									<button
										onClick={clearAll}
										className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
									>
										Limpiar todas
									</button>
								</div>
							)}

							{/* Notifications List */}
							{notifications.length === 0 ? (
								<div className="text-center py-8 text-gray-500 dark:text-gray-400">
									No hay notificaciones
								</div>
							) : (
								<div className="space-y-3">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
												notification.read ? 'opacity-75' : ''
											}`}
										>
											<div className="flex items-start gap-3">
												<div className="text-lg">
													{getNotificationIcon(notification.type)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<h4 className="font-medium text-gray-900 dark:text-white">
															{notification.title}
														</h4>
														<span className="text-xs text-gray-500 dark:text-gray-400">
															{notification.timestamp.toLocaleString('es-ES')}
														</span>
													</div>
													<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
														{notification.message}
													</p>
													{notification.action && (
														<button
															onClick={notification.action.onClick}
															className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
														>
															{notification.action.label}
														</button>
													)}
												</div>
												<div className="flex gap-1">
													{!notification.read && (
														<button
															onClick={() => markAsRead(notification.id)}
															className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
														>
															✓
														</button>
													)}
													<button
														onClick={() => removeNotification(notification.id)}
														className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
													>
														✕
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{/* Rules List */}
							{rules.map((rule) => (
								<div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<div className="flex items-center justify-between mb-3">
										<h4 className="font-medium text-gray-900 dark:text-white">
											{rule.name}
										</h4>
										<label className="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												checked={rule.enabled}
												onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
												className="sr-only peer"
											/>
											<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
										</label>
									</div>
									
									<div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
										<div>
											<strong>Tipo:</strong> {rule.condition === 'stock_low' ? 'Stock Bajo' : 
																	rule.condition === 'cost_high' ? 'Costos Altos' : 
																	rule.condition === 'reminder' ? 'Recordatorio' : 'Personalizado'}
										</div>
										{rule.threshold && (
											<div>
												<strong>Umbral:</strong> {rule.threshold}
											</div>
										)}
										<div>
											<strong>Mensaje:</strong> {rule.message}
										</div>
										<div>
											<strong>Frecuencia:</strong> Cada {rule.checkInterval} minutos
										</div>
										<div>
											<strong>Última revisión:</strong> {rule.lastChecked.toLocaleString('es-ES')}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default NotificationsPanel
