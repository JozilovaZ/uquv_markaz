import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'

const ROLE_LABELS = {
  admin: 'Administrator', manager: 'Menejer',
  teacher: "O'qituvchi", student: "O'quvchi", user: "O'quvchi",
}

export default function Navbar({ onToggleSidebar, title }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  return (
    <header className="h-16 bg-surface-card border-b border-surface-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-hover transition-colors text-gray-400 hover:text-white">
          ☰
        </button>
        {title && <h2 className="text-base font-semibold text-gray-200 hidden md:block">{title}</h2>}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-hover transition-colors text-gray-400 hover:text-white text-base"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-hover transition-colors text-gray-400 hover:text-white">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"/>
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 glass rounded-xl px-3 py-1.5 hover:border-primary-500/30 transition-all">
            <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
              {user?.firstName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-none">{user?.firstName}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role]}</p>
            </div>
            <span className="text-gray-500 text-xs">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-card py-1 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-surface-border">
                <p className="text-sm font-semibold text-white">{user?.firstName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={() => { setDropdownOpen(false); handleLogout() }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-hover transition-colors flex items-center gap-2">
                🚪 Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
