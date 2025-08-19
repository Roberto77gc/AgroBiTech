// Simple PDF-like export for daily records
// Note: jsPDF implementation removed due to build issues

export function exportDailyPdfLike(date: string, activityName: string, data: any) {
	try {
		// Create a simple text file instead of PDF
		const content = generateDailyReportText(date, activityName, data)
		downloadTextFile(content, `daily-report-${date}.txt`)
	} catch (error) {
		console.error('Error exporting daily report:', error)
	}
}

function generateDailyReportText(date: string, activityName: string, data: any): string {
	const lines: string[] = []
	
	lines.push('='.repeat(50))
	lines.push(`REPORTE DIARIO - ${activityName.toUpperCase()}`)
	lines.push(`Fecha: ${date}`)
	lines.push('='.repeat(50))
	lines.push('')
	
	// Fertilizers section
	if (data.fertilizers && data.fertilizers.length > 0) {
		lines.push('FERTILIZANTES:')
		lines.push('-'.repeat(20))
		data.fertilizers.forEach((f: any) => {
			lines.push(`${f.fertilizerType}: ${f.fertilizerAmount} ${f.fertilizerUnit} - €${f.cost.toFixed(2)}`)
		})
		lines.push('')
	}
	
	// Water section
	if (data.water) {
		lines.push('AGUA:')
		lines.push('-'.repeat(20))
		lines.push(`Consumo: ${data.water.consumption} ${data.water.unit}`)
		lines.push(`Costo: €${data.water.cost.toFixed(2)}`)
		lines.push('')
	}
	
	// Phytosanitaries section
	if (data.phytosanitary && data.phytosanitary.length > 0) {
		lines.push('FITOSANITARIOS:')
		lines.push('-'.repeat(20))
		data.phytosanitary.forEach((p: any) => {
			lines.push(`${p.productName}: ${p.amount} ${p.unit} - €${p.cost.toFixed(2)}`)
		})
		lines.push('')
	}
	
	// Other expenses section
	if (data.otherExpenses && data.otherExpenses.length > 0) {
		lines.push('OTROS GASTOS:')
		lines.push('-'.repeat(20))
		data.otherExpenses.forEach((e: any) => {
			lines.push(`${e.description}: ${e.amount} ${e.unit} - €${e.cost.toFixed(2)}`)
		})
		lines.push('')
	}
	
	// Total cost
	if (data.totalCost) {
		lines.push('TOTAL:')
		lines.push('-'.repeat(20))
		lines.push(`Costo Total: €${data.totalCost.toFixed(2)}`)
		lines.push('')
	}
	
	// Notes
	if (data.notes) {
		lines.push('NOTAS:')
		lines.push('-'.repeat(20))
		lines.push(data.notes)
		lines.push('')
	}
	
	// KPIs
	if (data.area || data.plants) {
		lines.push('KPIs:')
		lines.push('-'.repeat(20))
		if (data.area) lines.push(`Área: ${data.area} ha`)
		if (data.plants) lines.push(`Plantas: ${data.plants}`)
		lines.push('')
	}
	
	lines.push('='.repeat(50))
	lines.push('Fin del Reporte')
	lines.push('='.repeat(50))
	
	return lines.join('\n')
}

function downloadTextFile(content: string, filename: string) {
	const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}


