import React from 'react'

interface AgroBiTechLogoProps {
	size?: 'sm' | 'md' | 'lg' | 'xl'
	className?: string
	showText?: boolean
}

const AgroBiTechLogo: React.FC<AgroBiTechLogoProps> = ({ 
	size = 'md', 
	className = '',
	showText = true 
}) => {
	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-12 h-12',
		lg: 'w-16 h-16',
		xl: 'w-20 h-20'
	}

	const textSizes = {
		sm: 'text-lg',
		md: 'text-2xl',
		lg: 'text-3xl',
		xl: 'text-4xl'
	}

	return (
		<div className={`flex items-center space-x-3 ${className}`}>
			{/* Logo SVG Revolucionario */}
			<div className={`relative ${sizeClasses[size]} transform hover:rotate-3 transition-transform duration-300`}>
				<svg
					viewBox="0 0 100 100"
					className="w-full h-full"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Fondo del logo con gradiente */}
					<defs>
						<linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#10b981" />
							<stop offset="50%" stopColor="#059669" />
							<stop offset="100%" stopColor="#0d9488" />
						</linearGradient>
						<linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#ffffff" />
							<stop offset="100%" stopColor="#f0fdf4" />
						</linearGradient>
						<linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#f59e0b" />
							<stop offset="100%" stopColor="#d97706" />
						</linearGradient>
					</defs>

					{/* Círculo principal con gradiente */}
					<circle cx="50" cy="50" r="45" fill="url(#logoGradient)" stroke="#ffffff" strokeWidth="2" />

					{/* Hoja principal (agricultura) */}
					<path
						d="M50 20 Q60 15 70 25 Q75 35 70 45 Q65 55 50 60 Q35 55 30 45 Q25 35 30 25 Q40 15 50 20"
						fill="url(#leafGradient)"
						stroke="#059669"
						strokeWidth="1"
					/>

					{/* Circuitos tecnológicos */}
					<path
						d="M20 30 L35 30 M65 30 L80 30 M20 70 L35 70 M65 70 L80 70"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinecap="round"
					/>

					{/* Puntos de conexión */}
					<circle cx="35" cy="30" r="2" fill="#ffffff" />
					<circle cx="65" cy="30" r="2" fill="#ffffff" />
					<circle cx="35" cy="70" r="2" fill="#ffffff" />
					<circle cx="65" cy="70" r="2" fill="#ffffff" />

					{/* Símbolo de IA en el centro */}
					<circle cx="50" cy="50" r="8" fill="url(#aiGradient)" />
					<text x="50" y="55" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
						AI
					</text>

					{/* Elementos de innovación */}
					<path
						d="M15 15 L25 25 M85 15 L75 25 M15 85 L25 75 M85 85 L75 75"
						stroke="#fbbf24"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>

				{/* Indicador de innovación flotante */}
				<div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg transform rotate-12">
					🚀
				</div>
			</div>

			{/* Texto del logo - Corregido para evitar cortes */}
			{showText && (
				<div className="flex flex-col leading-tight">
					<h1 className={`${textSizes[size]} font-black bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent`}>
						AgroBiTech
					</h1>
					<p className="text-xs text-gray-600 font-medium">
						La Revolución Biotecnológica Agrícola
					</p>
				</div>
			)}
		</div>
	)
}

export default AgroBiTechLogo
