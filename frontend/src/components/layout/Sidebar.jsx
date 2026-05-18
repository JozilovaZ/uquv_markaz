import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { clsx } from 'clsx'

const MENUS = {
  admin: [
    { path: '/admin',               label: 'Dashboard',        icon: '📊' },
    { path: '/admin/users',         label: 'Foydalanuvchilar', icon: '👥' },
    { path: '/admin/courses',       label: 'Kurslar',          icon: '📚' },
    { path: '/admin/applications',  label: 'Arizalar',         icon: '📝' },
    { path: '/admin/teachers',      label: "O'qituvchilar",    icon: '👨‍🏫' },
    { path: '/admin/payments',      label: "To'lovlar",        icon: '💳' },
    { path: '/admin/settings',      label: 'Sozlamalar',       icon: '⚙️' },
    { divider: true },
    { path: '/manager',             label: 'Menejer panel',    icon: '💼' },
    { path: '/teacher',             label: "O'qituvchi panel", icon: '🎓' },
  ],
  manager: [
    { path: '/manager',             label: 'Dashboard',  icon: '📊' },
    { path: '/manager/students',    label: "O'quvchilar", icon: '🎒' },
    { path: '/manager/courses',     label: 'Kurslar',     icon: '📚' },
    { path: '/manager/payments',    label: "To'lovlar",   icon: '💳' },
  ],
  teacher: [
    { path: '/teacher',             label: 'Dashboard',   icon: '📊' },
    { path: '/teacher/courses',     label: 'Kurslar',     icon: '📚' },
    { path: '/teacher/assignments', label: 'Topshiriqlar',icon: '📝' },
    { path: '/teacher/students',    label: "O'quvchilar", icon: '🎒' },
    { path: '/teacher/attendance',  label: 'Davomat',     icon: '✅' },
  ],
  student: [
    { path: '/student',              label: 'Dashboard',   icon: '📊' },
    { path: '/student/courses',      label: 'Kurslarim',   icon: '📚' },
    { path: '/student/assignments',  label: 'Topshiriqlar',icon: '📝' },
    { path: '/student/progress',     label: 'Natijalarim', icon: '📈' },
    { path: '/student/payments',     label: "To'lovlarim", icon: '💳' },
  ],
}

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Menejer',
  teacher: "O'qituvchi",
  student: "O'quvchi",
  user: "O'quvchi",
}

const ROLE_COLORS = {
  admin: 'bg-red-500/20 text-red-300',
  manager: 'bg-blue-500/20 text-blue-300',
  teacher: 'bg-green-500/20 text-green-300',
  student: 'bg-primary-500/20 text-primary-300',
  user: 'bg-primary-500/20 text-primary-300',
}

export default function Sidebar({ role, collapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = MENUS[role] || MENUS.student

  function handleLogout() { logout(); navigate('/login') }

  return (
    <aside className={clsx(
      'h-screen flex flex-col bg-surface-card border-r border-surface-border transition-all duration-300 relative z-30',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-surface-border flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-glow">🎓</div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <span className="font-bold text-white text-lg leading-none block">EduCore</span>
            <span className="text-xs text-gray-500">LMS Platform</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {items.map((item, i) => {
          if (item.divider) return <div key={i} className="my-3 border-t border-surface-border"/>
          return (
            <NavLink key={item.path} to={item.path} end={item.path === `/${role}`}
              className={({ isActive }) => clsx('nav-item', isActive && 'active', collapsed && 'justify-center px-2')}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-surface-border flex-shrink-0">
        {!collapsed ? (
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.firstName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.firstName}</p>
                <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', ROLE_COLORS[user?.role] || ROLE_COLORS.student)}>
                  {ROLE_LABELS[user?.role] || "O'quvchi"}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2">
              <span>🚪</span> Chiqish
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center p-2 text-gray-500 hover:text-red-400 transition-colors" title="Chiqish">
            🚪
          </button>
        )}
      </div>
    </aside>
  )
}
