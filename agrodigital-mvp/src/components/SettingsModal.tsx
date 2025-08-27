import React, { useEffect, useState } from 'react'

interface SettingsModalProps {
	isOpen: boolean
	onClose: () => void
	isDarkMode: boolean
	onToggleDarkMode: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDarkMode, onToggleDarkMode }) => {
	const [fertUnit, setFertUnit] = useState<string>(() => { try { return localStorage.getItem('defaults:fertilizerUnit') || 'kg' } catch { return 'kg' } })
	const [phytoUnit, setPhytoUnit] = useState<string>(() => { try { return localStorage.getItem('defaults:phytosanitaryUnit') || 'L' } catch { return 'L' } })
	const [language, setLanguage] = useState<string>(() => { try { return localStorage.getItem('defaults:language') || 'es' } catch { return 'es' } })
    const [installPillEnabled, setInstallPillEnabled] = useState<boolean>(() => { try { return localStorage.getItem('pwa:installPill:enabled') !== '0' } catch { return true } })

	useEffect(() => { try { localStorage.setItem('defaults:fertilizerUnit', fertUnit) } catch {} }, [fertUnit])
	useEffect(() => { try { localStorage.setItem('defaults:phytosanitaryUnit', phytoUnit) } catch {} }, [phytoUnit])
	useEffect(() => { try { localStorage.setItem('defaults:language', language) } catch {} }, [language])
    useEffect(() => { try { localStorage.setItem('pwa:installPill:enabled', installPillEnabled ? '1' : '0') } catch {} }, [installPillEnabled])

	if (!isOpen) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="fixed inset-0 bg-black/50" onClick={onClose} />
			<div className={`relative w-full max-w-lg rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
				<div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
					<h2 className="text-lg font-semibold">Ajustes</h2>
					<button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>×</button>
				</div>
				<div className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Modo oscuro</p>
							<p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cambia el tema de la aplicación</p>
						</div>
						<button onClick={onToggleDarkMode} className={`${isDarkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-lg text-sm`}>{isDarkMode ? 'Activado' : 'Activar'}</button>
					</div>

					<div>
						<p className="font-medium mb-2">Unidades por defecto</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fertilizantes</label>
								<select value={fertUnit} onChange={(e) => setFertUnit(e.target.value)} className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
									<option value="kg">kg</option>
									<option value="g">g</option>
									<option value="L">L</option>
									<option value="ml">ml</option>
								</select>
							</div>
							<div>
								<label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fitosanitarios</label>
								<select value={phytoUnit} onChange={(e) => setPhytoUnit(e.target.value)} className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
									<option value="L">L</option>
									<option value="ml">ml</option>
									<option value="kg">kg</option>
									<option value="g">g</option>
								</select>
							</div>
						</div>
					</div>

					<div>
						<p className="font-medium mb-2">Idioma</p>
						<select value={language} onChange={(e) => setLanguage(e.target.value)} className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
							<option value="es">Español</option>
							<option value="en">English (placeholder)</option>
						</select>
						<p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Multi-idioma llegará en próximas versiones.</p>
					</div>

					<div>
						<p className="font-medium mb-2">Instalación como App</p>
						<div className="flex gap-2">
							<button onClick={() => { try { localStorage.removeItem('pwa:installPill:dismissed') } catch {}; try { window.dispatchEvent(new Event('app:show-install')) } catch {} }} className={`${isDarkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'} px-3 py-2 rounded text-sm`}>Restablecer aviso de instalación</button>
						</div>
						<div className="mt-3 flex items-center justify-between">
							<div>
								<p className="font-medium text-sm">Píldora persistente “Instalar app”</p>
								<p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Muestra un botón flotante si el banner se descartó</p>
							</div>
							<button onClick={() => setInstallPillEnabled(v => !v)} className={`${installPillEnabled ? (isDarkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800') : (isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800')} px-3 py-2 rounded text-sm`}>{installPillEnabled ? 'Mostrando' : 'Oculto'}</button>
						</div>
					</div>
				</div>
				<div className={`p-4 border-t flex justify-end ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
					<button onClick={onClose} className={`${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded`}>Cerrar</button>
				</div>
			</div>
		</div>
	)
}

export default SettingsModal
