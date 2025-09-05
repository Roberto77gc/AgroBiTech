import React from 'react'
import { Award, Shield, Clock, CheckCircle } from 'lucide-react'

const TrustElements: React.FC = () => {
	const trustItems = [
		{
			icon: Award,
			text: 'Certificado ISO 27001',
			color: 'text-yellow-500',
			description: 'Seguridad de la información'
		},
		{
			icon: Shield,
			text: '100% Seguro y Privado',
			color: 'text-blue-500',
			description: 'Encriptación de nivel bancario'
		},
		{
			icon: Clock,
			text: 'Soporte 24/7',
			color: 'text-green-500',
			description: 'Asistencia técnica continua'
		},
		{
			icon: CheckCircle,
			text: 'Verificado por UE',
			color: 'text-purple-500',
			description: 'Cumplimiento normativo europeo'
		}
	]

	return (
		<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
			{trustItems.map((item, index) => (
				<div key={index} className="flex items-center space-x-2 group cursor-pointer">
					<item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color} group-hover:scale-110 transition-transform duration-300`} />
					<div className="text-center">
						<span className="text-xs sm:text-sm text-gray-600 font-bold block group-hover:text-gray-800 transition-colors">
							{item.text}
						</span>
						<span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
							{item.description}
						</span>
					</div>
				</div>
			))}
		</div>
	)
}

export default TrustElements
