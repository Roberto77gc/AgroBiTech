export function formatCurrencyEUR(value: number): string {
	const safe = Number.isFinite(value) ? value : 0
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(safe)
}


