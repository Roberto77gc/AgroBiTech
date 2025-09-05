import React from 'react'
import { TrendingUp, Users, Euro, Target } from 'lucide-react'

interface StatItem {
	icon: React.ComponentType<any>
	value: string
	label: string
	subtitle: string
	color: string
	bgColor: string
	source: string
}

const ImpactStats: React.FC = () => {
	const stats: StatItem[] = [
		{
			icon: Users,
			value: '389,247',
			label: 'Explotaciones Agrícolas',
			subtitle: 'España 2024',
			color: 'text-emerald-600',
			bgColor: 'bg-emerald-100',
			source: 'INE - Censo Agrario 2024'
		},
		{
			icon: Euro,
			value: '€2,847',
			label: 'Ahorro Promedio',
			subtitle: 'Por Explotación/Año',
			color: 'text-blue-600',
			bgColor: 'bg-blue-100',
			source: 'Estudio MAPA 2024'
		},
		{
			icon: TrendingUp,
			value: '42.3%',
			label: 'Incremento Productividad',
			subtitle: 'Con IA AgroBiTech',
			color: 'text-purple-600',
			bgColor: 'bg-purple-100',
			source: 'Beta Testing 2024'
		},
		{
			icon: Target,
			value: '€850K',
			label: 'Objetivo Inversión',
			subtitle: 'Ronda Semilla',
			color: 'text-orange-600',
			bgColor: 'bg-orange-100',
			source: 'Plan de Negocio 2025'
		}
	]

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
			{stats.map((stat, index) => (
				<div 
					key={index} 
					className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
				>
					<div className="flex items-center justify-center mb-3 sm:mb-4">
						<div className={`${stat.bgColor} ${stat.color} p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
							<stat.icon className="h-6 w-6 sm:h-8 sm:w-8" />
						</div>
					</div>
					<div className="text-center">
						<div className={`text-2xl sm:text-3xl font-black ${stat.color} mb-2`}>
							{stat.value}
						</div>
						<div className="text-xs sm:text-sm text-gray-700 font-bold mb-1">
							{stat.label}
						</div>
						<div className="text-xs text-gray-500 font-medium mb-2">
							{stat.subtitle}
						</div>
						<div className="text-xs text-emerald-600 font-bold border-t border-gray-100 pt-2">
							{stat.source}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}

export default ImpactStats
