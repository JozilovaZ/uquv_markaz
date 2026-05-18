import { useState, useEffect } from 'react'
import { statsAPI, assignmentsAPI, teacherCoursesAPI } from '../../services/api'
import { Card, Badge, StatCard, Spinner } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats,       setStats]       = useState({})
  const [assignments, setAssignments] = useState([])
  const [courses,     setCourses]     = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      statsAPI.teacher().then(r => r.data).catch(() => ({})),
      assignmentsAPI.list().then(r => r.data.slice(0, 5)).catch(() => []),
      teacherCoursesAPI.myList().then(r => r.data.slice(0, 6)).catch(() => []),
    ]).then(([s, a, c]) => { setStats(s); setAssignments(a); setCourses(c) })
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  const QUICK = [
    { label: '📝 Topshiriq qo\'shish',    to: '/teacher/assignments' },
    { label: '✅ Davomat belgilash',       to: '/teacher/attendance'  },
    { label: '🎒 O\'quvchilar ro\'yxati',  to: '/teacher/students'    },
    { label: '📚 Kurslar',                 to: '/teacher/courses'     },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Salom, {user?.firstName}! 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">O'qituvchi paneli</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami kurslar"    value={stats?.courses     || courses.length} icon="📚" color="purple"/>
        <StatCard title="O'quvchilar"     value={stats?.students    || 0}              icon="🎒" color="blue"/>
        <StatCard title="Yozilishlar"     value={stats?.enrollments || 0}              icon="📋" color="green"/>
        <StatCard title="Topshiriqlar"    value={assignments.length}                   icon="📝" color="yellow"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent assignments */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">So'nggi topshiriqlar</h3>
            <button onClick={() => navigate('/teacher/assignments')}
              className="text-xs text-primary-400 hover:text-primary-300">Barchasi →</button>
          </div>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-gray-500 text-sm">Hali topshiriq yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-surface-border">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📝</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.course_title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{a.submission_count || 0} ta</p>
                    {a.deadline && <p className="text-[10px] text-gray-600">{fmtDate(a.deadline)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <h3 className="font-semibold text-white mb-4">⚡ Tezkor amallar</h3>
          <div className="space-y-2">
            {QUICK.map(q => (
              <button key={q.label} onClick={() => navigate(q.to)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20 hover:border-primary-500/50 transition-all hover:scale-[1.02]">
                {q.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Courses */}
      {courses.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Kurslar</h3>
            <button onClick={() => navigate('/teacher/courses')}
              className="text-xs text-primary-400 hover:text-primary-300">Barchasi →</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {courses.map(c => (
              <div key={c.id} className="p-3 bg-surface-hover rounded-xl border border-surface-border">
                <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">{c.category}</span>
                  {c.price > 0 && <span className="text-xs text-gray-400">{fmt(c.price)} so'm</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
