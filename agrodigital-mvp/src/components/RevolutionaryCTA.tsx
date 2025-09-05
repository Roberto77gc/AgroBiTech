import React from 'react'
import { ArrowRight, Zap, Star, Rocket, TrendingUp } from 'lucide-react'

const RevolutionaryCTA: React.FC = () => {
	return (
		<div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
			<div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
				<div className="flex-1 text-center lg:text-left">
					<div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
						<Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
						<h3 className="text-xl sm:text-2xl font-black">🚀 Únete a la Revolución</h3>
					</div>
					<p className="text-base sm:text-lg text-emerald-100 font-medium mb-4">
						Acceso gratuito durante el lanzamiento beta
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6 text-sm">
						<div className="flex items-center space-x-2">
							<Star className="h-4 w-4 text-yellow-300" />
							<span>Acceso completo gratuito</span>
						</div>
						<div className="flex items-center space-x-2">
							<Zap className="h-4 w-4 text-yellow-300" />
							<span>Funciones premium incluidas</span>
						</div>
						<div className="flex items-center space-x-2">
							<TrendingUp className="h-4 w-4 text-yellow-300" />
							<span>Sin compromisos</span>
						</div>
					</div>
				</div>
				<div className="flex items-center space-x-4">
					<div className="text-center lg:text-right">
						<div className="text-2xl sm:text-3xl font-black text-yellow-300">¡GRATIS!</div>
						<div className="text-xs sm:text-sm text-emerald-100">Por tiempo limitado</div>
					</div>
					<ArrowRight className="h-8 w-8 sm:h-10 sm:w-10 text-white group-hover:translate-x-2 transition-transform duration-300" />
				</div>
			</div>
		</div>
	)
}

export default RevolutionaryCTA
