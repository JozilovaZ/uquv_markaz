import { clsx } from 'clsx'

export function Card({ children, className = '', gradient = false }) {
  return (
    <div className={clsx('glass rounded-2xl p-5 glass-hover transition-all duration-300', gradient && 'bg-gradient-card', className)}>
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', icon, loading, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-glow',
    secondary: 'bg-surface-hover hover:bg-surface-border text-gray-200 border border-surface-border',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30',
    ghost: 'text-gray-400 hover:text-white hover:bg-surface-hover',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={loading} {...props}>
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : icon}
      {children}
    </button>
  )
}

export function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>}
        <input className={clsx('input-field', icon && 'pl-10', className)} {...props}/>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <select className={clsx('input-field', className)} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Badge({ children, color = 'purple' }) {
  const colors = {
    purple: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
    green:  'bg-green-500/20 text-green-400 border border-green-500/30',
    red:    'bg-red-500/20 text-red-400 border border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    blue:   'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    gray:   'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  }
  return <span className={clsx('badge', colors[color])}>{children}</span>
}

export function Avatar({ name = '', size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-primary-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={clsx('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', sizes[size], color)}>
      {initials || '?'}
    </div>
  )
}

export function StatCard({ title, value, change, icon, color = 'purple' }) {
  const colors = {
    purple: 'from-primary-500/20 to-primary-700/10 border-primary-500/20',
    blue:   'from-blue-500/20 to-blue-700/10 border-blue-500/20',
    green:  'from-green-500/20 to-green-700/10 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-700/10 border-yellow-500/20',
    red:    'from-red-500/20 to-red-700/10 border-red-500/20',
    cyan:   'from-cyan-500/20 to-cyan-700/10 border-cyan-500/20',
  }
  const iconColors = { purple:'text-primary-400', blue:'text-blue-400', green:'text-green-400', yellow:'text-yellow-400', red:'text-red-400', cyan:'text-cyan-400' }
  const isPos = change?.startsWith('+')
  return (
    <div className={clsx('stat-card bg-gradient-to-br border', colors[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
          {change && (
            <p className={clsx('text-xs font-medium mt-1', isPos ? 'text-green-400' : 'text-red-400')}>
              {change} <span className="text-gray-500">o'tgan oyga nisbatan</span>
            </p>
          )}
        </div>
        <div className={clsx('text-3xl', iconColors[color])}>{icon}</div>
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
      <div className={clsx('relative glass rounded-2xl p-6 w-full shadow-2xl animate-fade-in', sizes[size])} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-hover transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return <div className={clsx('border-2 border-primary-500 border-t-transparent rounded-full animate-spin', s[size])}/>
}

export function EmptyState({ icon = '📭', title = 'Ma\'lumot topilmadi', desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-gray-300 font-semibold text-lg">{title}</p>
      {desc && <p className="text-gray-500 text-sm mt-1">{desc}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
