import React, { useEffect, useMemo, useState } from 'react'

interface ProductOption {
	_id: string
	name: string
	unit?: string
	pricePerUnit?: number
	type?: string
}

interface Props {
	isDarkMode: boolean
	indexKey: number
	value: string
	options: ProductOption[]
	recentIds?: string[]
	filterText: string
	onFilterChange: (text: string) => void
	onChange: (productId: string) => void
	debounceMs?: number
	pageSize?: number
}

const ProductSelect: React.FC<Props> = ({ isDarkMode, indexKey, value, options, recentIds = [], filterText, onFilterChange, onChange, debounceMs = 250, pageSize = 25 }) => {
	const [inputText, setInputText] = useState<string>(filterText || '')
	const [page, setPage] = useState<number>(0)
	const selectRef = React.useRef<HTMLSelectElement | null>(null)

	useEffect(() => { setInputText(filterText || ''); setPage(0) }, [filterText])

	useEffect(() => {
		const h = window.setTimeout(() => { onFilterChange(inputText) }, debounceMs)
		return () => window.clearTimeout(h)
	}, [inputText, onFilterChange, debounceMs])

	const filtered = useMemo(() => (options || []).filter(p => p.name.toLowerCase().includes((inputText || '').toLowerCase())), [options, inputText])
	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
	const clampedPage = Math.min(page, totalPages - 1)
	const pageItems = filtered.slice(clampedPage * pageSize, (clampedPage + 1) * pageSize)

	// Para selects nativos no podemos resaltar con HTML dentro de <option>, así que mostramos texto plano
	return (
		<div>
			<input type="text" value={inputText} onKeyDown={(e) => {
				if (e.key === 'ArrowDown' && selectRef.current) { e.preventDefault(); selectRef.current.focus() }
				if (e.key === 'Enter') {
					if (pageItems.length === 1) { onChange(pageItems[0]._id) }
				}
			}} onChange={e => { setInputText(e.target.value); setPage(0) }} placeholder="Buscar producto..." className={`w-full mb-2 px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
			{(recentIds || []).length > 0 && (
				<div className="mb-2 flex flex-wrap gap-2">
					{(recentIds.slice(0,3)).map(id => {
						const prod = options.find(p => p._id === id)
						if (!prod) return null
						return <button key={`${indexKey}_${id}`} type="button" onClick={() => onChange(id)} className={`${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-2 py-1 rounded text-xs`}>{prod.name}</button>
					})}
				</div>
			)}
			<select ref={selectRef} value={value} onKeyDown={(e) => {
				const el = e.target as HTMLSelectElement
				if (e.key === 'Escape') { el.blur(); return }
				if (e.key === 'ArrowDown') {
					e.preventDefault()
					const next = Math.min((el.selectedIndex || 0) + 1, el.options.length - 1)
					el.selectedIndex = next
					return
				}
				if (e.key === 'ArrowUp') {
					e.preventDefault()
					const next = Math.max((el.selectedIndex || 0) - 1, 0)
					el.selectedIndex = next
					return
				}
				if (e.key === 'Enter') {
					e.preventDefault()
					const opt = el.options[el.selectedIndex]
					if (opt) onChange(opt.value)
				}
			}} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
				<option value="">{filtered.length === 0 ? 'No hay productos disponibles' : 'Seleccionar producto'}</option>
				{pageItems.map(product => (
					<option key={product._id} value={product._id}>
						{/* name highlighted plus price/unit */}
						{product.name} - {(product.pricePerUnit || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}/{product.unit}
					</option>
				))}
			</select>
			{filtered.length > pageSize && (
				<div className="mt-2 flex items-center justify-between text-xs">
					<button type="button" disabled={clampedPage === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className={`${clampedPage === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Anterior</button>
					<span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Página {clampedPage + 1} de {totalPages}</span>
					<button type="button" disabled={clampedPage >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} className={`${clampedPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Siguiente</button>
				</div>
			)}
		</div>
	)
}

export default ProductSelect


