import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  id?: string
  durationMs?: number // solo para success/info por defecto; error/warning pueden persistir
  actionLabel?: string
  onAction?: () => void
}

interface ToastItem {
  id: string
  type: ToastType
  message: string
  createdAt: number
  durationMs?: number
  actionLabel?: string
  onAction?: () => void
}

interface ToastContextValue {
  show: (type: ToastType, message: string, options?: ToastOptions) => void
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const idgen = () => Math.random().toString(36).slice(2)

export const ToastProvider: React.FC<{ children: React.ReactNode; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; isDarkMode?: boolean }>
  = ({ children, position = 'top-right', isDarkMode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = options?.id || idgen()
    const item: ToastItem = {
      id,
      type,
      message,
      createdAt: Date.now(),
      durationMs: options?.durationMs,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    }
    setToasts(prev => [...prev, item])

    // Autocierre solo para success/info por defecto
    const shouldAutoClose = type === 'success' || type === 'info'
    const timeout = options?.durationMs ?? 2500
    if (shouldAutoClose) {
      window.setTimeout(() => remove(id), timeout)
    }
  }, [remove])

  const api: ToastContextValue = useMemo(() => ({
    show,
    success: (m, o) => show('success', m, o),
    error: (m, o) => show('error', m, o),
    warning: (m, o) => show('warning', m, o),
    info: (m, o) => show('info', m, o),
    remove,
  }), [remove, show])

  // Suscripción global a errores de API
  React.useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ endpoint: string; status?: number; message?: string }>
        const msg = ce.detail?.message || `API error${ce.detail?.status ? ` (${ce.detail.status})` : ''}`
        show('error', msg)
      } catch {}
    }
    window.addEventListener('app:api-error', handler as EventListener)
    return () => window.removeEventListener('app:api-error', handler as EventListener)
  }, [show])

  const posClass = useMemo(() => {
    const base = 'fixed z-[9999]'
    switch (position) {
      case 'top-left': return `${base} top-4 left-4`
      case 'bottom-right': return `${base} bottom-4 right-4`
      case 'bottom-left': return `${base} bottom-4 left-4`
      default: return `${base} top-4 right-4`
    }
  }, [position])

  const colorClass = (type: ToastType) => {
    const light = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-yellow-500 text-black',
      info: 'bg-slate-700 text-white',
    } as const
    const dark = light // por ahora mantenemos mismos colores para dark
    return (isDarkMode ? dark : light)[type]
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Contenedor visual */}
      <div className={posClass}>
        <div className="flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`relative pl-4 pr-16 py-2 rounded shadow-lg ${colorClass(t.type)} flex items-center gap-3`}>
              <span className="flex-1">{t.message}</span>
              {t.actionLabel && t.onAction && (
                <button onClick={() => { t.onAction?.(); remove(t.id) }} className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-sm">
                  {t.actionLabel}
                </button>
              )}
              <button onClick={() => remove(t.id)} className="absolute top-1/2 -translate-y-1/2 right-2 px-2 text-white/80 hover:text-white">✕</button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider


