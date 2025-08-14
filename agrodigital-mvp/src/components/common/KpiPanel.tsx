import React from 'react'

interface Props {
	areaHa?: number
	plants?: number
	totalCost: number
	formatCurrency: (n: number) => string
	isDarkMode: boolean
}

const KpiPanel: React.FC<Props> = ({ areaHa = 0, plants = 0, totalCost, formatCurrency, isDarkMode }) => {
	if (areaHa <= 0 && plants <= 0) return null
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-1">
			{areaHa > 0 && (
				<div className="flex justify-between">
					<span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coste/ha</span>
					<span className="font-semibold">{formatCurrency(totalCost / areaHa)}</span>
				</div>
			)}
			{plants > 0 && (
				<div className="flex justify-between">
					<span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coste/planta</span>
					<span className="font-semibold">{formatCurrency(totalCost / plants)}</span>
				</div>
			)}
		</div>
	)
}

export default KpiPanel


