export function mustBePositiveNumber(n: any, fallback = 0): number {
	const num = Number(n)
	if (!isFinite(num) || isNaN(num) || num < 0) return fallback
	return num
}

export function nonEmptyString(s: any, fallback = ''): string {
	const str = String(s ?? '')
	return str.trim().length > 0 ? str : fallback
}

export function validateUnitForType(unit: string, allowed: string[]): { ok: boolean; message?: string } {
	if (!allowed.includes(unit)) {
		return { ok: false, message: `Unidad inválida. Permitidas: ${allowed.join(', ')}` }
	}
	return { ok: true }
}

export function validatePositiveNumberField(text: string, defaultValue = 0): { value: number; error?: string } {
	const normalized = (text || '').replace(',', '.')
	const n = Number(normalized)
	if (!isFinite(n) || isNaN(n)) return { value: defaultValue, error: 'Introduce un número válido' }
	if (n < 0) return { value: defaultValue, error: 'El valor no puede ser negativo' }
	return { value: n }
}


