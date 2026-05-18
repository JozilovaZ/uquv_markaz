import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

const TITLES = {
  '/admin': 'Dashboard', '/admin/users': 'Foydalanuvchilar', '/admin/courses': 'Kurslar', '/admin/settings': 'Sozlamalar',
  '/manager': 'Dashboard', '/manager/students': "O'quvchilar", '/manager/enrollments': 'Yozilishlar', '/manager/payments': "To'lovlar",
  '/teacher': 'Dashboard', '/teacher/courses': 'Kurslarim', '/teacher/students': "O'quvchilar", '/teacher/attendance': 'Davomat',
  '/student': 'Dashboard', '/student/courses': 'Kurslarim', '/student/progress': 'Natijalarim', '/student/payments': "To'lovlarim",
}

export default function DashboardLayout({ role }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'EduCore'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setMobileSidebarOpen(false)}/>
      )}

      {/* Sidebar — desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar role={role} collapsed={collapsed}/>
      </div>

      {/* Sidebar — mobile */}
      <div className={`fixed left-0 top-0 h-full z-30 md:hidden transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar role={role} collapsed={false}/>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={title}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) setMobileSidebarOpen(!mobileSidebarOpen)
            else setCollapsed(!collapsed)
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
