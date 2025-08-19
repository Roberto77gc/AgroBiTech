import React, { useState, useEffect, useMemo } from 'react'
import { useMobileOptimization } from '../../hooks/useMobileOptimization'

interface AdaptiveDashboardProps {
	children: React.ReactNode
	className?: string
	columns?: number
	spacing?: 'compact' | 'comfortable' | 'spacious'
}

const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({
	children,
	className = '',
	columns = 4,
	spacing = 'comfortable'
}) => {
	const { isMobile, isTablet, shouldAnimate, performanceMetrics } = useMobileOptimization()
	const [currentLayout, setCurrentLayout] = useState<'grid' | 'list' | 'carousel'>('grid')

	// Auto-detect optimal layout based on device and performance
	useEffect(() => {
		if (isMobile) {
			if (performanceMetrics.fps < 30) {
				setCurrentLayout('list') // List view for low-performance devices
			} else if (isTablet) {
				setCurrentLayout('grid') // Grid for tablets
			} else {
				setCurrentLayout('carousel') // Carousel for mobile phones
			}
		} else {
			setCurrentLayout('grid') // Grid for desktop
		}
	}, [isMobile, isTablet, performanceMetrics.fps])

	// Responsive grid configuration
	const gridConfig = useMemo(() => {
		if (isMobile) {
			return {
				columns: isTablet ? 2 : 1,
				gap: spacing === 'compact' ? 'gap-2' : spacing === 'spacious' ? 'gap-6' : 'gap-4',
				padding: spacing === 'compact' ? 'p-2' : spacing === 'spacious' ? 'p-6' : 'p-4'
			}
		}
		
		return {
			columns: Math.min(columns, 6), // Max 6 columns
			gap: spacing === 'compact' ? 'gap-4' : spacing === 'spacious' ? 'gap-8' : 'gap-6',
			padding: spacing === 'compact' ? 'p-4' : spacing === 'spacious' ? 'p-8' : 'p-6'
		}
	}, [isMobile, isTablet, columns, spacing])

	// Animation classes based on performance
	const animationClasses = useMemo(() => {
		if (!shouldAnimate()) {
			return 'transition-none'
		}
		
		return isMobile ? 'transition-all duration-200' : 'transition-all duration-300'
	}, [shouldAnimate, isMobile])

	// Render different layouts
	const renderLayout = () => {
		switch (currentLayout) {
			case 'grid':
				return (
					<div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridConfig.columns} ${gridConfig.gap} ${gridConfig.padding}`}>
						{children}
					</div>
				)
			
			case 'list':
				return (
					<div className={`flex flex-col space-y-${spacing === 'compact' ? '2' : spacing === 'spacious' ? '6' : '4'} ${gridConfig.padding}`}>
						{children}
					</div>
				)
			
			case 'carousel':
				return (
					<div className={`flex overflow-x-auto snap-x snap-mandatory ${gridConfig.padding} gap-4 pb-4`}>
						{React.Children.map(children, (child) => (
							<div className="flex-shrink-0 snap-start w-80">
								{child}
							</div>
						))}
					</div>
				)
			
			default:
				return <div>{children}</div>
		}
	}

	// Performance indicator (debug)
	const renderPerformanceIndicator = () => {
		if (!isMobile) return null
		
		return (
			<div className="fixed top-20 right-4 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
				<div>FPS: {performanceMetrics.fps}</div>
				<div>Layout: {currentLayout}</div>
				<div>Animations: {shouldAnimate() ? 'ON' : 'OFF'}</div>
			</div>
		)
	}

	return (
		<div className={`adaptive-dashboard ${className}`}>
			{/* Layout Controls - Only show on mobile */}
			{isMobile && (
				<div className="flex justify-center mb-4 space-x-2">
					<button
						onClick={() => setCurrentLayout('grid')}
						className={`px-3 py-1 rounded text-sm ${
							currentLayout === 'grid' 
								? 'bg-green-500 text-white' 
								: 'bg-gray-200 text-gray-700'
						}`}
					>
						Grid
					</button>
					<button
						onClick={() => setCurrentLayout('list')}
						className={`px-3 py-1 rounded text-sm ${
							currentLayout === 'list' 
								? 'bg-green-500 text-white' 
								: 'bg-gray-200 text-gray-700'
						}`}
					>
						Lista
					</button>
					<button
						onClick={() => setCurrentLayout('carousel')}
						className={`px-3 py-1 rounded text-sm ${
							currentLayout === 'carousel' 
								? 'bg-green-500 text-white' 
								: 'bg-gray-200 text-gray-700'
						}`}
					>
						Carrusel
					</button>
				</div>
			)}

			{/* Main Content */}
			<div className={animationClasses}>
				{renderLayout()}
			</div>

			{/* Performance Indicator */}
			{renderPerformanceIndicator()}
		</div>
	)
}

export default AdaptiveDashboard
