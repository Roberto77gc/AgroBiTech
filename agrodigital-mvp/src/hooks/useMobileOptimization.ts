import { useEffect, useState, useCallback, useRef } from 'react'

interface MobileOptimizationConfig {
	reduceAnimations: boolean
	enableHapticFeedback: boolean
	optimizeImages: boolean
	enableTouchGestures: boolean
}

export const useMobileOptimization = () => {
	const [isMobile, setIsMobile] = useState(false)
	const [isTablet, setIsTablet] = useState(false)
	const [isLowEndDevice, setIsLowEndDevice] = useState(false)
	const [config, setConfig] = useState<MobileOptimizationConfig>({
		reduceAnimations: false,
		enableHapticFeedback: true,
		optimizeImages: true,
		enableTouchGestures: true
	})
	const lastInteraction = useRef<number>(0)

	// Detect device capabilities
	useEffect(() => {
		const detectDevice = () => {
			const userAgent = navigator.userAgent.toLowerCase()
			const isMobileDevice = /mobile|android|iphone|ipad|phone/i.test(userAgent)
			const isTabletDevice = /tablet|ipad/i.test(userAgent)
			
			setIsMobile(isMobileDevice)
			setIsTablet(isTabletDevice)

			// Detect low-end devices
			const memory = (navigator as any).deviceMemory || 4
			const cores = (navigator as any).hardwareConcurrency || 4
			const isLowEnd = memory < 4 || cores < 4
			setIsLowEndDevice(isLowEnd)

			// Auto-configure based on device capabilities
			if (isLowEnd) {
				setConfig(prev => ({
					...prev,
					reduceAnimations: true,
					optimizeImages: true
				}))
			}
		}

		detectDevice()
		window.addEventListener('resize', detectDevice)
		return () => window.removeEventListener('resize', detectDevice)
	}, [])

	// Performance monitoring
	const [performanceMetrics, setPerformanceMetrics] = useState({
		fps: 60,
		memoryUsage: 0,
		lastFrameTime: 0
	})

	useEffect(() => {
		if (!isMobile) return

		let frameCount = 0
		let lastTime = performance.now()
		let animationId: number

		const measurePerformance = (currentTime: number) => {
			frameCount++
			
			if (currentTime - lastTime >= 1000) {
				const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
				setPerformanceMetrics(prev => ({
					...prev,
					fps,
					lastFrameTime: currentTime - lastTime
				}))
				
				frameCount = 0
				lastTime = currentTime
			}

			animationId = requestAnimationFrame(measurePerformance)
		}

		animationId = requestAnimationFrame(measurePerformance)

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId)
			}
		}
	}, [isMobile])

	// Touch gesture optimization
	const [touchGestures, setTouchGestures] = useState({
		swipeThreshold: 50,
		longPressDelay: 500,
		doubleTapDelay: 300
	})

	useEffect(() => {
		if (!isMobile) return

		// Adjust thresholds based on device performance
		if (isLowEndDevice) {
			setTouchGestures({
				swipeThreshold: 80, // Higher threshold for low-end devices
				longPressDelay: 800,
				doubleTapDelay: 500
			})
		}
	}, [isMobile, isLowEndDevice])

	// Memory management
	const cleanupResources = useCallback(() => {
		if (isMobile && isLowEndDevice) {
			// Clear image cache
			if ('caches' in window) {
				caches.keys().then(names => {
					names.forEach(name => {
						if (name.includes('image')) {
							caches.delete(name)
						}
					})
				})
			}

			// Force garbage collection if available
			if ((window as any).gc) {
				(window as any).gc()
			}
		}
	}, [isMobile, isLowEndDevice])

	// Battery optimization
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
	const [isCharging, setIsCharging] = useState<boolean | null>(null)

	useEffect(() => {
		if (!isMobile || !('getBattery' in navigator)) return

		const getBatteryInfo = async () => {
			try {
				const battery = await (navigator as any).getBattery()
				
				const updateBatteryInfo = () => {
					setBatteryLevel(battery.level * 100)
					setIsCharging(battery.charging)
				}

				updateBatteryInfo()
				battery.addEventListener('levelchange', updateBatteryInfo)
				battery.addEventListener('chargingchange', updateBatteryInfo)

				return () => {
					battery.removeEventListener('levelchange', updateBatteryInfo)
					battery.removeEventListener('chargingchange', updateBatteryInfo)
				}
			} catch (error) {
				console.warn('Could not get battery info:', error)
			}
		}

		getBatteryInfo()
	}, [isMobile])

	// Auto-optimize based on battery level
	useEffect(() => {
		if (batteryLevel !== null && batteryLevel < 20) {
			setConfig(prev => ({
				...prev,
				reduceAnimations: true,
				optimizeImages: true,
				enableHapticFeedback: false
			}))
		}
	}, [batteryLevel])

	// Interaction tracking for performance optimization
	const trackInteraction = useCallback(() => {
		lastInteraction.current = Date.now()
	}, [])

	// Debounced interaction handler
	const debouncedInteraction = useCallback((callback: () => void, delay: number = 100) => {
		const now = Date.now()
		if (now - lastInteraction.current > delay) {
			callback()
			trackInteraction()
		}
	}, [trackInteraction])

	// Image optimization
	const optimizeImage = useCallback((src: string, quality: number = 0.8) => {
		if (!config.optimizeImages || !isMobile) return src

		// Add quality parameter for mobile
		if (src.includes('?')) {
			return `${src}&q=${quality}`
		}
		return `${src}?q=${quality}`
	}, [config.optimizeImages, isMobile])

	// Animation optimization
	const shouldAnimate = useCallback(() => {
		return !config.reduceAnimations && performanceMetrics.fps > 30
	}, [config.reduceAnimations, performanceMetrics.fps])

	// Haptic feedback
	const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
		if (!config.enableHapticFeedback || !isMobile) return

		try {
			if ('vibrate' in navigator) {
				const patterns = {
					light: 50,
					medium: 100,
					heavy: 200
				}
				navigator.vibrate(patterns[pattern])
			}
		} catch (error) {
			console.warn('Haptic feedback not supported:', error)
		}
	}, [config.enableHapticFeedback, isMobile])

	return {
		// Device detection
		isMobile,
		isTablet,
		isLowEndDevice,
		
		// Configuration
		config,
		setConfig,
		
		// Performance
		performanceMetrics,
		shouldAnimate,
		
		// Touch optimization
		touchGestures,
		
		// Battery info
		batteryLevel,
		isCharging,
		
		// Utilities
		cleanupResources,
		trackInteraction,
		debouncedInteraction,
		optimizeImage,
		triggerHaptic
	}
}
