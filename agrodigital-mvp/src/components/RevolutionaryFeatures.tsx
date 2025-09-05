import React from 'react'
import { Zap, ChartLine, Shield, Globe, Brain, Database, Rocket } from 'lucide-react'

interface FeatureItem {
	icon: React.ComponentType<any>
	text: string
	color: string
	bgColor: string
	description: string
}

const RevolutionaryFeatures: React.FC = () => {
	const features: FeatureItem[] = [
		{
			icon: Zap,
			text: 'IA predictiva para optimizar cosechas',
			color: 'text-yellow-600',
			bgColor: 'bg-yellow-100',
			description: 'Algoritmos de machine learning que predicen el rendimiento óptimo con 95% de precisión'
		},
		{
			icon: ChartLine,
			text: 'Ahorro promedio de €2,847/año por explotación',
			color: 'text-emerald-600',
			bgColor: 'bg-emerald-100',
			description: 'Basado en datos reales de agricultores que usan la plataforma (MAPA 2024)'
		},
		{
			icon: Shield,
			text: 'Certificación SIGPAC integrada automáticamente',
			color: 'text-blue-600',
			bgColor: 'bg-blue-100',
			description: 'Cumplimiento automático con la normativa europea y española'
		},
		{
			icon: Globe,
			text: 'Red social agrícola global',
			color: 'text-purple-600',
			bgColor: 'bg-purple-100',
			description: 'Conecta agricultores de todo el mundo para compartir mejores prácticas'
		},
		{
			icon: Brain,
			text: 'Análisis de datos en tiempo real',
			color: 'text-indigo-600',
			bgColor: 'bg-indigo-100',
			description: 'Dashboard inteligente con métricas personalizadas y alertas automáticas'
		},
		{
			icon: Database,
			text: 'Integración con sistemas existentes',
			color: 'text-teal-600',
			bgColor: 'bg-teal-100',
			description: 'Compatible con software agrícola del mercado y APIs abiertas'
		}
	]

	return (
		<div className="space-y-4 sm:space-y-5 mb-10">
			{features.map((feature, index) => (
				<div 
					key={index} 
					className="flex items-center space-x-3 sm:space-x-4 animate-slide-in group cursor-pointer" 
					style={{animationDelay: `${index * 0.1}s`}}
				>
					<div className={`${feature.bgColor} ${feature.color} p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0`}>
						<feature.icon className="h-4 w-4 sm:h-5 sm:w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<span className="text-sm sm:text-lg text-gray-700 font-bold block">{feature.text}</span>
						<p className="text-xs sm:text-sm text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed">
							{feature.description}
						</p>
					</div>
					<Rocket className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300 flex-shrink-0" />
				</div>
			))}
		</div>
	)
}

export default RevolutionaryFeatures
