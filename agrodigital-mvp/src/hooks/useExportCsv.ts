export interface CsvRow {
	[key: string]: string | number | null | undefined
}

function toCsvLine(values: Array<string | number>): string {
	return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
}

export function downloadCsv(filename: string, lines: string[]) {
	const csv = lines.join('\n')
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

export function useExportCsv() {
	const exportRows = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
		const lines: string[] = []
		if (headers.length) lines.push(headers.join(','))
		for (const r of rows) lines.push(toCsvLine(r))
		downloadCsv(filename, lines)
	}

	return { exportRows }
}


