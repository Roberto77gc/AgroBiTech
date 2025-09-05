import React from 'react'
import { Leaf, Mail, Phone, MapPin, Globe, Shield, Award, Zap } from 'lucide-react'

const ProfessionalFooter: React.FC = () => {
	return (
		<footer className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white py-12 sm:py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Sección principal del footer */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
					{/* Logo y descripción */}
					<div className="col-span-1 md:col-span-2">
						<div className="flex items-center space-x-3 mb-4 sm:mb-6">
							<div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
								<Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
							</div>
							<div>
								<h3 className="text-xl sm:text-2xl font-black text-white">AgroBiTech</h3>
								<p className="text-xs sm:text-sm text-emerald-200">La Revolución Biotecnológica Agrícola</p>
							</div>
						</div>
						<p className="text-sm sm:text-lg text-emerald-200 leading-relaxed mb-4 sm:mb-6">
							Transformamos la agricultura tradicional con <strong>Inteligencia Artificial</strong>, 
							<strong>Biotecnología</strong> y <strong>tecnología blockchain</strong>. 
							Únete a los agricultores que ya están duplicando sus beneficios.
						</p>
						<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
							<div className="flex items-center space-x-2">
								<Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
								<span className="text-xs sm:text-sm text-emerald-200">ISO 27001</span>
							</div>
							<div className="flex items-center space-x-2">
								<Award className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
								<span className="text-xs sm:text-sm text-emerald-200">Certificado UE</span>
							</div>
							<div className="flex items-center space-x-2">
								<Zap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
								<span className="text-xs sm:text-sm text-emerald-200">Innovación IA</span>
							</div>
						</div>
					</div>

					{/* Innovación */}
					<div>
						<h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-emerald-100">🚀 Innovación</h4>
						<ul className="text-xs sm:text-sm text-emerald-200 space-y-1 sm:space-y-2">
							<li>• IA Predictiva</li>
							<li>• Biotecnología</li>
							<li>• Big Data</li>
							<li>• IoT Integration</li>
							<li>• Machine Learning</li>
							<li>• Cloud Computing</li>
						</ul>
					</div>

					{/* Contacto */}
					<div>
						<h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-emerald-100">📞 Contacto</h4>
						<div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-emerald-200">
							<div className="flex items-center space-x-2">
								<Mail className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
								<span>agrobitech@agrobitech.com</span>
							</div>
							<div className="flex items-center space-x-2">
								<Phone className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
								<span>+34 678 672 528</span>
							</div>
							<div className="flex items-center space-x-2">
								<MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
								<span>Madrid, España</span>
							</div>
							<div className="flex items-center space-x-2">
								<Globe className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
								<span>www.agrobitech.com</span>
							</div>
						</div>
					</div>
				</div>

				{/* Línea divisoria */}
				<div className="border-t border-emerald-700 pt-6 sm:pt-8">
					<div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
						{/* Copyright */}
						<div className="flex items-center space-x-2">
							<div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1 sm:p-2 rounded-lg">
								<Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
							</div>
							<span className="text-xs sm:text-sm text-emerald-200 text-center">
								© 2025 AgroBiTech. La Revolución Biotecnológica Agrícola.
							</span>
						</div>

						{/* Badges de estado */}
						<div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
							<span className="text-xs sm:text-sm text-emerald-300">Version MVP Beta</span>
							<span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold shadow-lg">
								🚀 Acceso Gratuito
							</span>
							<span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold">
								AI Powered
							</span>
						</div>
					</div>

					{/* Información legal */}
					<div className="mt-4 sm:mt-6 text-center">
						<div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs text-emerald-300">
							<span className="hover:text-white cursor-pointer transition-colors">Política de Privacidad</span>
							<span className="hover:text-white cursor-pointer transition-colors">Términos de Servicio</span>
							<span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
							<span className="hover:text-white cursor-pointer transition-colors">GDPR</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}

export default ProfessionalFooter
