import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DailyRecord {
	date: string
	fertilizersCost?: number
	waterCost?: number
	phytosanitaryCost?: number
	otherExpensesCost?: number
	totalCost: number
	notes?: string
}

interface FertilizerRecord {
	fertilizerType: string
	fertilizerAmount: number
	fertilizerUnit: string
	cost: number
}

interface PhytosanitaryRecord {
	phytosanitaryType: string
	phytosanitaryAmount: number
	phytosanitaryUnit: string
	cost: number
}

interface WaterRecord {
	consumption: number
	unit: string
	cost: number
}

interface OtherExpenseRecord {
	description: string
	amount: number
	cost: number
}

export const exportDailyPdf = (
	date: string,
	activityName: string,
	data: {
		fertilizers?: FertilizerRecord[]
		phytosanitary?: PhytosanitaryRecord[]
		water?: WaterRecord
		otherExpenses?: OtherExpenseRecord[]
		totalCost: number
		notes?: string
		area?: number
		plants?: number
	}
) => {
	const doc = new jsPDF()
	
	// Header
	doc.setFontSize(24)
	doc.setTextColor(34, 139, 34) // Green color
	doc.text('AgroDigital', 20, 30)
	
	doc.setFontSize(16)
	doc.setTextColor(0, 0, 0)
	doc.text(`Reporte Diario - ${activityName}`, 20, 45)
	doc.text(`Fecha: ${new Date(date).toLocaleDateString('es-ES')}`, 20, 55)
	
	// Summary section
	doc.setFontSize(14)
	doc.setTextColor(0, 0, 0)
	doc.text('Resumen de Costos', 20, 75)
	
	// Summary table
	const summaryData = [
		['Concepto', 'Cantidad', 'Costo (€)'],
		['Fertilizantes', data.fertilizers?.length || 0, (data.fertilizers?.reduce((sum, f) => sum + f.cost, 0) || 0).toFixed(2)],
		['Fitosanitarios', data.phytosanitary?.length || 0, (data.phytosanitary?.reduce((sum, p) => sum + p.cost, 0) || 0).toFixed(2)],
		['Agua', data.water ? `${data.water.consumption} ${data.water.unit}` : '0', (data.water?.cost || 0).toFixed(2)],
		['Otros Gastos', data.otherExpenses?.length || 0, (data.otherExpenses?.reduce((sum, o) => sum + o.cost, 0) || 0).toFixed(2)],
		['', '', ''],
		['TOTAL', '', data.totalCost.toFixed(2)]
	]
	
	autoTable(doc, {
		head: [['Concepto', 'Cantidad', 'Costo (€)']],
		body: summaryData.slice(1, -2),
		startY: 80,
		styles: {
			fontSize: 10,
			cellPadding: 3,
		},
		headStyles: {
			fillColor: [34, 139, 34],
			textColor: 255,
			fontStyle: 'bold'
		},
		alternateRowStyles: {
			fillColor: [245, 245, 245]
		}
	})
	
	// Total row
	autoTable(doc, {
		body: [['TOTAL', '', `€${data.totalCost.toFixed(2)}`]],
		startY: (doc as any).lastAutoTable.finalY + 5,
		styles: {
			fontSize: 12,
			fontStyle: 'bold',
			cellPadding: 5,
		},
		bodyStyles: {
			fillColor: [34, 139, 34],
			textColor: 255
		}
	})
	
	let currentY = (doc as any).lastAutoTable.finalY + 15
	
	// KPIs if available
	if (data.area || data.plants) {
		doc.setFontSize(12)
		doc.setTextColor(0, 0, 0)
		doc.text('Indicadores de Rendimiento', 20, currentY)
		currentY += 10
		
		const kpiData = []
		if (data.area) {
			const costPerHa = data.totalCost / data.area
			kpiData.push(['Costo por Hectárea', `€${costPerHa.toFixed(2)}/ha`])
		}
		if (data.plants) {
			const costPerPlant = data.totalCost / data.plants
			kpiData.push(['Costo por Planta', `€${costPerPlant.toFixed(4)}/planta`])
		}
		
		autoTable(doc, {
			body: kpiData,
			startY: currentY,
			styles: {
				fontSize: 10,
				cellPadding: 3,
			},
			bodyStyles: {
				fillColor: [240, 248, 255]
			}
		})
		
		currentY = (doc as any).lastAutoTable.finalY + 10
	}
	
	// Detailed tables
	if (data.fertilizers && data.fertilizers.length > 0) {
		doc.setFontSize(12)
		doc.setTextColor(0, 0, 0)
		doc.text('Detalle de Fertilizantes', 20, currentY)
		currentY += 10
		
		const fertData = data.fertilizers.map(f => [
			f.fertilizerType,
			`${f.fertilizerAmount} ${f.fertilizerUnit}`,
			`€${f.cost.toFixed(2)}`
		])
		
		autoTable(doc, {
			head: [['Tipo', 'Cantidad', 'Costo']],
			body: fertData,
			startY: currentY,
			styles: {
				fontSize: 9,
				cellPadding: 2,
			},
			headStyles: {
				fillColor: [70, 130, 180],
				textColor: 255
			}
		})
		
		currentY = (doc as any).lastAutoTable.finalY + 10
	}
	
	if (data.phytosanitary && data.phytosanitary.length > 0) {
		doc.setFontSize(12)
		doc.setTextColor(0, 0, 0)
		doc.text('Detalle de Fitosanitarios', 20, currentY)
		currentY += 10
		
		const phytData = data.phytosanitary.map(p => [
			p.phytosanitaryType,
			`${p.phytosanitaryAmount} ${p.phytosanitaryUnit}`,
			`€${p.cost.toFixed(2)}`
		])
		
		autoTable(doc, {
			head: [['Tipo', 'Cantidad', 'Costo']],
			body: phytData,
			startY: currentY,
			styles: {
				fontSize: 9,
				cellPadding: 2,
			},
			headStyles: {
				fillColor: [255, 140, 0],
				textColor: 255
			}
		})
		
		currentY = (doc as any).lastAutoTable.finalY + 10
	}
	
	if (data.otherExpenses && data.otherExpenses.length > 0) {
		doc.setFontSize(12)
		doc.setTextColor(0, 0, 0)
		doc.text('Otros Gastos', 20, currentY)
		currentY += 10
		
		const otherData = data.otherExpenses.map(o => [
			o.description,
			`€${o.amount.toFixed(2)}`,
			`€${o.cost.toFixed(2)}`
		])
		
		autoTable(doc, {
			head: [['Descripción', 'Monto', 'Costo']],
			body: otherData,
			startY: currentY,
			styles: {
				fontSize: 9,
				cellPadding: 2,
			},
			headStyles: {
				fillColor: [128, 128, 128],
				textColor: 255
			}
		})
		
		currentY = (doc as any).lastAutoTable.finalY + 10
	}
	
	// Notes
	if (data.notes) {
		doc.setFontSize(12)
		doc.setTextColor(0, 0, 0)
		doc.text('Notas:', 20, currentY)
		currentY += 10
		
		doc.setFontSize(10)
		doc.setTextColor(100, 100, 100)
		const notesLines = doc.splitTextToSize(data.notes, 170)
		doc.text(notesLines, 20, currentY)
		currentY += notesLines.length * 5 + 10
	}
	
	// Footer
	doc.setFontSize(8)
	doc.setTextColor(128, 128, 128)
	doc.text(`Generado el ${new Date().toLocaleString('es-ES')} por AgroDigital`, 20, currentY + 10)
	doc.text('Plataforma digital para agricultores', 20, currentY + 20)
	
	// Save the PDF
	const filename = `agrodigital-${activityName}-${date.replace(/-/g, '')}.pdf`
	doc.save(filename)
}

// Legacy function for backward compatibility
export const exportDailyPdfLike = exportDailyPdf


