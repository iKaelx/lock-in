import { appConfig } from '../../config'

export function AdSlot({ variant = 'banner' }: { variant?: 'banner' | 'sidebar' | 'in-content' }) {
  if (!appConfig.adsEnabled) return null
  return (
    <aside aria-label="Advertisement" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-400">
      {variant === 'sidebar' ? 'Sponsored content' : 'Advertisement'}
    </aside>
  )
}
