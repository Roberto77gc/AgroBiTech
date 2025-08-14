export function exportDailyPdfLike(filename: string, data: { title: string; date: string; lines: string[] }) {
	// Implementación simple: generar un archivo .txt con formato pseudo-PDF para evitar dependencias
	const content = [
		`AgroDigital - ${data.title}`,
		`Fecha: ${data.date}`,
		'',
		...data.lines,
	].join('\n')
	const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf` // extensión .pdf para que el usuario lo reconozca como reporte
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}


