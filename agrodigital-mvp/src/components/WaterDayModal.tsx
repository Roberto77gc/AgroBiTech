import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface DailyWaterRecord {
	date: string
	consumption: number
	unit: string
	cost: number
	notes: string
}

interface WaterDayModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (dayData: DailyWaterRecord) => void
	existingDay?: DailyWaterRecord
	activityName: string
	isDarkMode: boolean
}

const WaterDayModal: React.FC<WaterDayModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	existingDay,
	activityName,
	isDarkMode
}) => {
	const [formData, setFormData] = useState<DailyWaterRecord>({
		date: '',
		consumption: 0,
		unit: 'L',
		cost: 0,
		notes: ''
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<{ [key: string]: string }>({})

	useEffect(() => {
		if (isOpen) {
			if (existingDay) {
				setFormData(existingDay)
			} else {
				setFormData({
					date: new Date().toISOString().split('T')[0],
					consumption: 0,
					unit: 'L',
					cost: 0,
					notes: ''
				})
			}
		}
	}, [isOpen, existingDay])

	const handleInputChange = (field: keyof DailyWaterRecord, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: '' }))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			const newErrors: { [key: string]: string } = {}
			
			if (!formData.date) {
				newErrors.date = 'La fecha es requerida'
			}
			
			if (formData.consumption <= 0) {
				newErrors.consumption = 'El consumo debe ser mayor a 0'
			}

			if (Object.keys(newErrors).length > 0) {
				setErrors(newErrors)
				return
			}

			await onSubmit(formData)
			onClose()
		} catch (error) {
			console.error('Error submitting water day:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		if (e.target.value === '0') {
			e.target.value = ''
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className={`w-full max-w-2xl rounded-xl shadow-xl transition-colors ${
				isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
			}`}>
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold">
						{existingDay ? 'Editar Día de Agua' : 'Añadir Día de Agua'}
					</h2>
					<button
						onClick={onClose}
						className={`p-2 rounded-lg transition-colors ${
							isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
						}`}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-6">
					<div className="mb-4">
						<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Actividad: <span className="font-medium">{activityName}</span>
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Fecha del Día
							</label>
							<input
								type="date"
								value={formData.date}
								onChange={(e) => handleInputChange('date', e.target.value)}
								className={`w-full px-3 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
							/>
							{errors.date && (
								<p className="text-red-500 text-sm mt-1">{errors.date}</p>
							)}
						</div>

						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Consumo de Agua
							</label>
							<div className="flex space-x-2">
								<input
									type="number"
									step="0.01"
									min="0"
									value={formData.consumption}
									onChange={(e) => handleInputChange('consumption', parseFloat(e.target.value) || 0)}
									onFocus={handleNumberFocus}
									className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder="0"
								/>
								<select
									value={formData.unit}
									onChange={(e) => handleInputChange('unit', e.target.value)}
									className={`px-3 py-2 border rounded-lg transition-colors ${
										isDarkMode 
											? 'bg-gray-700 border-gray-600 text-white' 
											: 'bg-white border-gray-300 text-gray-900'
									}`}
								>
									<option value="L">L</option>
									<option value="m3">m³</option>
								</select>
							</div>
							{errors.consumption && (
								<p className="text-red-500 text-sm mt-1">{errors.consumption}</p>
							)}
						</div>

						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Coste del Agua (€)
							</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={formData.cost}
								onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
								onFocus={handleNumberFocus}
								className={`w-full px-3 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								placeholder="0.00"
							/>
						</div>

						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDarkMode ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Notas del Día
							</label>
							<textarea
								value={formData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								rows={3}
								className={`w-full px-3 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'bg-gray-700 border-gray-600 text-white' 
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								placeholder="Observaciones sobre el consumo de agua del día..."
							/>
						</div>

						<div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
							<button
								type="button"
								onClick={onClose}
								className={`px-4 py-2 border rounded-lg transition-colors ${
									isDarkMode 
										? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
										: 'border-gray-300 text-gray-700 hover:bg-gray-50'
								}`}
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
							>
								{isSubmitting ? 'Guardando...' : (existingDay ? 'Actualizar Día' : 'Añadir Día')}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default WaterDayModal
