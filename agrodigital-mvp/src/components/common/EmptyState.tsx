import React from 'react'

interface Props {
	title: string
	subtitle?: string
	isDarkMode: boolean
}

const EmptyState: React.FC<Props> = ({ title, subtitle, isDarkMode }) => {
	return (
		<div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
			<p className="text-lg font-medium">{title}</p>
			{subtitle && <p className="text-sm">{subtitle}</p>}
		</div>
	)
}

export default EmptyState


