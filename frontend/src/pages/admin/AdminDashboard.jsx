import { useState, useEffect } from 'react'
import { statsAPI, activityAPI } from '../../services/api'
import { StatCard, Card, PageHeader, Spinner, Badge } from '../../components/ui'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../../context/AuthContext'

const MONTHLY = [
  { month: 'Yan', students: 42, revenue: 8400000 },
  { month: 'Fev', students: 58, revenue: 11200000 },
  { month: 'Mar', students: 71, revenue: 14600000 },
  { month: 'Apr', students: 65, revenue: 13000000 },
  { month: 'May', students: 89, revenue: 18200000 },
  { month: 'Iyn', students: 102, revenue: 21400000 },
]

const PIE_DATA = [
  { name: 'IT', value: 38, color: '#945CE9' },
  { name: 'Dizayn', value: 22, color: '#3b82f6' },
  { name: 'Marketing', value: 18, color: '#10b981' },
  { name: 'Tillar', value: 14, color: '#f59e0b' },
  { name: 'Boshqa', value: 8, color: '#6b7280' },
]

const COLOR_MAP = { green: 'text-green-400', blue: 'text-blue-400', yellow: 'text-yellow-400', purple: 'text-primary-400', red: 'text-red-400' }

function relTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Hozirgina'
  if (m < 60) return `${m} daqiqa oldin`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} soat oldin`
  return new Date(d).toLocaleDateString('uz-UZ')
}

function fmt(n) { return new Intl.NumberFormat('uz-UZ').format(n) }

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsAPI.admin().then(r => r.data).catch(() => ({ users: 0, courses: 0, teachers: 0, enrollments: 0, applications: 0 })),
      activityAPI.list().then(r => r.data).catch(() => []),
    ]).then(([s, a]) => { setStats(s); setActivities(a) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Salom, {user?.firstName}! 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">EduCore boshqaruv paneli</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow"/>
          <span className="text-sm text-gray-300">Tizim faol</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Jami o'quvchilar" value={fmt(stats?.users || 0)} change="+12%" icon="🎒" color="purple"/>
        <StatCard title="Faol kurslar" value={fmt(stats?.courses || 0)} change="+3%" icon="📚" color="blue"/>
        <StatCard title="O'qituvchilar" value={fmt(stats?.teachers || 0)} change="+5%" icon="👩‍🏫" color="green"/>
        <StatCard title="Yozilishlar" value={fmt(stats?.enrollments || 0)} change="+18%" icon="📋" color="yellow"/>
        <StatCard title="Yangi arizalar" value={fmt(stats?.applications || 0)} change="" icon="📝" color="red"/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">O'quvchilar dinamikasi</h3>
              <p className="text-xs text-gray-500">2026 yil</p>
            </div>
            <Badge color="purple">+24% o'sish</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#945CE9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#945CE9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#374151" tick={{ fill: '#9CA3AF', fontSize: 12 }}/>
              <YAxis stroke="#374151" tick={{ fill: '#9CA3AF', fontSize: 12 }}/>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: 12, color: '#fff' }}/>
              <Area type="monotone" dataKey="students" stroke="#945CE9" fill="url(#grad1)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart */}
        <Card>
          <h3 className="font-semibold text-white mb-4">Kurslar bo'yicha</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: 12, color: '#fff' }}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {PIE_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}/>
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-gray-300 font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Daromad (so'm)</h3>
            <Badge color="green">+32%</Badge>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={MONTHLY}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#374151" tick={{ fill: '#9CA3AF', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: 12, color: '#fff' }}
                formatter={v => [fmt(v) + " so'm", 'Daromad']}/>
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#grad2)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">So'nggi faoliyat</h3>
            <Badge color="blue">{activities.length} ta</Badge>
          </div>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-gray-500 text-sm">Hozircha faoliyat yo'q</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-surface-border last:border-0">
                  <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${COLOR_MAP[a.color] || 'text-gray-300'} leading-snug`}>{a.text}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{relTime(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
