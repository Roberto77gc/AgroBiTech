import React, { useEffect, useRef } from 'react'

interface TemplateItem {
	_id: string
	name: string
}

interface Props {
	isDarkMode: boolean
	isLoading: boolean
	savedTemplates: TemplateItem[]
	onApplyLastDay?: () => void
	onApplyQuick?: () => void
	onUseSaved: (tpl: TemplateItem) => void
	onUpdateSaved: (tpl: TemplateItem) => void
	onRenameStart: (tpl: TemplateItem) => void
	onDelete: (tpl: TemplateItem) => void
	newTemplateName: string
	onNewTemplateNameChange: (v: string) => void
	onSaveCurrentAsTemplate: () => void
}

const TemplatesMenu: React.FC<Props> = ({
	isDarkMode,
	isLoading,
	savedTemplates,
	onApplyLastDay,
	onApplyQuick,
	onUseSaved,
	onUpdateSaved,
	onRenameStart,
	onDelete,
	newTemplateName,
	onNewTemplateNameChange,
	onSaveCurrentAsTemplate,
}) => {
	const menuRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		try { menuRef.current?.focus() } catch {}
	}, [])
	return (
		<div ref={menuRef} tabIndex={-1} role="menu" aria-label="Plantillas" className={`absolute right-0 mt-2 w-72 rounded-lg shadow ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
			<div className="px-3 py-2 text-xs opacity-70">Plantillas rápidas</div>
			{onApplyLastDay && (
				<button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onApplyLastDay}>Usar último día</button>
			)}
			{onApplyQuick && (
				<button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onApplyQuick}>Plantilla rápida</button>
			)}
			{isLoading && (<div className="px-3 py-2 text-sm opacity-70">Cargando…</div>)}
			<div className="h-px my-2 bg-gray-200 dark:bg-gray-700" />
			<div className="px-3 py-2 text-xs opacity-70">Mis plantillas</div>
			<div className="max-h-56 overflow-y-auto">
				{(savedTemplates || []).length === 0 ? (
					<div className="px-3 py-2 text-sm opacity-70">No tienes plantillas guardadas</div>
				) : (
					(savedTemplates as any[]).map((tpl) => (
						<div key={tpl._id} role="group" aria-label={tpl.name} className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
							<div className="flex items-center justify-between">
								<span className="truncate mr-2">{tpl.name}</span>
								<div className="flex gap-2">
									<button type="button" role="menuitem" className="text-green-600 hover:underline" onClick={() => onUseSaved(tpl)}>Usar</button>
									<button type="button" role="menuitem" className="text-blue-600 hover:underline" onClick={() => onUpdateSaved(tpl)}>Actualizar</button>
									{onRenameStart && (
										<button type="button" role="menuitem" className="text-yellow-600 hover:underline" onClick={() => onRenameStart(tpl)}>Renombrar</button>
									)}
									<button type="button" role="menuitem" className="text-red-600 hover:underline" onClick={() => onDelete(tpl)}>Borrar</button>
								</div>
							</div>
						</div>
					))
				)}
			</div>
			<div className="h-px my-2 bg-gray-200 dark:bg-gray-700" />
			<div className="p-3 flex gap-2">
				<input aria-label="Nombre de plantilla" value={newTemplateName} onChange={e => onNewTemplateNameChange(e.target.value)} placeholder="Nombre de plantilla" className={`flex-1 px-2 py-1 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
				<button type="button" role="menuitem" onClick={onSaveCurrentAsTemplate} className={`${isDarkMode ? 'bg-orange-700 hover:bg-orange-600' : 'bg-orange-600 hover:bg-orange-700'} px-3 py-1 rounded text-white`}>Guardar</button>
			</div>
		</div>
	)
}

export default TemplatesMenu


