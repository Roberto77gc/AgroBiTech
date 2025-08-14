type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
	level: LogLevel
	message: string
	context?: Record<string, any>
	timestamp: number
}

const STORAGE_KEY = 'agrodigital:logs'

export function logEvent(level: LogLevel, message: string, context?: Record<string, any>) {
	const entry: LogEntry = { level, message, context, timestamp: Date.now() }
	try {
		const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as LogEntry[]
		prev.push(entry)
		localStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(-200)))
	} catch {}
}

export function readLogs(): LogEntry[] {
	try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as LogEntry[] } catch { return [] }
}

export function clearLogs() { try { localStorage.removeItem(STORAGE_KEY) } catch {} }


