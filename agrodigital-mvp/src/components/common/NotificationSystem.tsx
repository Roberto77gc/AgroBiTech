import React, { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationsPanel from './NotificationsPanel'

const NotificationSystem: React.FC = () => {
	const [showNotifications, setShowNotifications] = useState(false)
	const { unreadCount } = useNotifications()

	return (
		<>
			<button
				onClick={() => setShowNotifications(true)}
				className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				title="Notificaciones"
			>
				🔔
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
						{unreadCount}
					</span>
				)}
			</button>

			<NotificationsPanel
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
			/>
		</>
	)
}

export default NotificationSystem
