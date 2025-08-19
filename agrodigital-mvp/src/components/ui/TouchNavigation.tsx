import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Home, BarChart3, Package, Settings } from 'lucide-react'

interface TouchNavigationProps {
	className?: string
	onNavigate: (route: string) => void
	currentRoute: string
}

interface NavigationItem {
	id: string
	label: string
	icon: React.ReactNode
	route: string
}

const TouchNavigation: React.FC<TouchNavigationProps> = ({ 
	className = '', 
	onNavigate, 
	currentRoute 
}) => {
	const [isVisible, setIsVisible] = useState(false)
	const [touchStart, setTouchStart] = useState<number | null>(null)
	const [touchEnd, setTouchEnd] = useState<number | null>(null)
	const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const lastScrollY = useRef(0)

	const navigationItems: NavigationItem[] = [
		{ id: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" />, route: 'dashboard' },
		{ id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, route: 'analytics' },
		{ id: 'inventory', label: 'Inventario', icon: <Package className="h-5 w-5" />, route: 'inventory' },
		{ id: 'settings', label: 'Ajustes', icon: <Settings className="h-5 w-5" />, route: 'settings' }
	]

	// Show/hide navigation based on scroll direction
	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY
			const isScrollingDown = currentScrollY > lastScrollY.current
			const isScrollingUp = currentScrollY < lastScrollY.current
			
			// Show navigation when scrolling up, hide when scrolling down
			if (isScrollingUp && currentScrollY > 100) {
				setIsVisible(true)
			} else if (isScrollingDown) {
				setIsVisible(false)
			}
			
			lastScrollY.current = currentScrollY
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Touch event handlers for swipe gestures
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		setTouchStart(e.targetTouches[0].clientX)
	}, [])

	const handleTouchMove = useCallback((e: React.TouchEvent) => {
		setTouchEnd(e.targetTouches[0].clientX)
	}, [])

	const handleTouchEnd = useCallback(() => {
		if (!touchStart || !touchEnd) return

		const distance = touchStart - touchEnd
		const isLeftSwipe = distance > 50
		const isRightSwipe = distance < -50

		if (isLeftSwipe) {
			setSwipeDirection('left')
			// Navigate to next item
			const currentIndex = navigationItems.findIndex(item => item.route === currentRoute)
			const nextIndex = (currentIndex + 1) % navigationItems.length
			onNavigate(navigationItems[nextIndex].route)
		} else if (isRightSwipe) {
			setSwipeDirection('right')
			// Navigate to previous item
			const currentIndex = navigationItems.findIndex(item => item.route === currentRoute)
			const prevIndex = currentIndex === 0 ? navigationItems.length - 1 : currentIndex - 1
			onNavigate(navigationItems[prevIndex].route)
		}

		// Reset touch states
		setTouchStart(null)
		setTouchEnd(null)
		
		// Clear swipe direction after animation
		setTimeout(() => setSwipeDirection(null), 300)
	}, [touchStart, touchEnd, currentRoute, navigationItems, onNavigate])

	// Haptic feedback for mobile devices
	const triggerHapticFeedback = useCallback(() => {
		if ('vibrate' in navigator) {
			navigator.vibrate(50)
		}
	}, [])

	const handleNavigationClick = useCallback((route: string) => {
		triggerHapticFeedback()
		onNavigate(route)
	}, [onNavigate, triggerHapticFeedback])

	// Auto-hide navigation after inactivity
	useEffect(() => {
		if (!isVisible) return

		const timeout = setTimeout(() => {
			setIsVisible(false)
		}, 3000)

		return () => clearTimeout(timeout)
	}, [isVisible])

	return (
		<div
			ref={containerRef}
			className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
				isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
			} ${className}`}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Swipe Indicator */}
			{swipeDirection && (
				<div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium transition-all duration-300 ${
					swipeDirection === 'left' ? 'text-blue-500' : 'text-green-500'
				}`}>
					{swipeDirection === 'left' ? (
						<div className="flex items-center gap-1">
							<ChevronLeft className="h-4 w-4" />
							<span>Anterior</span>
						</div>
					) : (
						<div className="flex items-center gap-1">
							<span>Siguiente</span>
							<ChevronRight className="h-4 w-4" />
						</div>
					)}
				</div>
			)}

			{/* Navigation Bar */}
			<div className={`
				bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700
				px-2 py-2 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90
			`}>
				<div className="flex items-center gap-1">
					{navigationItems.map((item) => (
						<button
							key={item.id}
							onClick={() => handleNavigationClick(item.route)}
							className={`
								flex flex-col items-center justify-center p-3 rounded-full transition-all duration-200
								${currentRoute === item.route
									? 'bg-green-500 text-white shadow-lg scale-110'
									: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
								}
								active:scale-95 touch-manipulation
							`}
							aria-label={item.label}
						>
							{item.icon}
							<span className="text-xs mt-1 font-medium hidden sm:block">
								{item.label}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Swipe Hint */}
			<div className="mt-2 text-center">
				<p className="text-xs text-gray-500 dark:text-gray-400 opacity-60">
					Desliza para navegar
				</p>
			</div>
		</div>
	)
}

export default TouchNavigation
