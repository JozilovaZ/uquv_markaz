import { useState, useEffect } from 'react'
import { statsAPI, paymentsAPI } from '../../services/api'
import { managerStudentsAPI } from '../../services/api'
import { StatCard, Card, Badge, Avatar, Spinner } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const MONTHLY = [
  { month: 'Yan', yozilish: 12, chiqish: 3 },
  { month: 'Fev', yozilish: 18, chiqish: 5 },
  { month: 'Mar', yozilish: 25, chiqish: 4 },
  { month: 'Apr', yozilish: 21, chiqish: 6 },
  { month: 'May', yozilish: 32, chiqish: 7 },
  { month: 'Iyn', yozilish: 28, chiqish: 4 },
]

const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0)

const PAY_STATUS = {
  paid:    { label: "To'ladi",    color: 'green' },
  pending: { label: 'Kutilmoqda', color: 'yellow' },
  unpaid:  { label: 'Qarzdor',    color: 'red' },
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      statsAPI.manager().then(r => r.data).catch(() => ({})),
      managerStudentsAPI.list().then(r => r.data.slice(0, 5)).catch(() => []),
      paymentsAPI.list().then(r => r.data.slice(0, 6)).catch(() => []),
    ]).then(([s, st, p]) => { setStats(s); setStudents(st); setPayments(p) })
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  const QUICK = [
    { label: "➕ Yangi o'quvchi qo'shish", color:'purple', to:'/manager/students' },
    { label: "💳 To'lov qabul qilish",     color:'green',  to:'/manager/payments' },
    { label: "📋 Kurs ro'yxatga olish",     color:'blue',   to:'/manager/courses'  },
    { label: "👥 O'quvchilar ro'yxati",     color:'yellow', to:'/manager/students' },
  ]
  const colorCls = {
    purple:'bg-primary-500/20 text-primary-300 border border-primary-500/20 hover:border-primary-500/50',
    green: 'bg-green-500/20 text-green-300 border border-green-500/20 hover:border-green-500/50',
    blue:  'bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:border-blue-500/50',
    yellow:'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 hover:border-yellow-500/50',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Salom, {user?.firstName}! 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">Menejer boshqaruv paneli</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami o'quvchilar"   value={fmt(stats?.students)}             icon="🎒" color="purple"/>
        <StatCard title="Bu oy yozilgan"      value={fmt(stats?.monthly_enrollments)}  icon="📋" color="blue" change="+18%"/>
        <StatCard title="Kutayotgan to'lovlar" value={fmt(stats?.pending_payments)}    icon="⏳" color="yellow"/>
        <StatCard title="Daromad (jami)"      value={fmt(stats?.revenue) + " so'm"}   icon="💰" color="green"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Yozilish dinamikasi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY} barGap={4}>
              <XAxis dataKey="month" stroke="#374151" tick={{ fill: '#9CA3AF', fontSize: 12 }}/>
              <YAxis stroke="#374151" tick={{ fill: '#9CA3AF', fontSize: 12 }}/>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: 12, color: '#fff' }}/>
              <Bar dataKey="yozilish" fill="#945CE9" radius={[4,4,0,0]} name="Yozilgan"/>
              <Bar dataKey="chiqish"  fill="#ef4444" radius={[4,4,0,0]} opacity={0.7} name="Chiqqan"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4">⚡ Tezkor amallar</h3>
          <div className="space-y-2">
            {QUICK.map(q => (
              <button key={q.label} onClick={() => navigate(q.to)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] ${colorCls[q.color]}`}>
                {q.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* So'nggi o'quvchilar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">So'nggi o'quvchilar</h3>
            <button onClick={() => navigate('/manager/students')}
              className="text-xs text-primary-400 hover:text-primary-300">Barchasi →</button>
          </div>
          {students.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">O'quvchilar yo'q</p>
          ) : (
            <div className="space-y-3">
              {students.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <Avatar name={s.firstName || '?'} size="md"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{s.firstName}</p>
                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                  </div>
                  <Badge color="green">{s.enrollment_count || 0} kurs</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* So'nggi to'lovlar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">So'nggi to'lovlar</h3>
            <button onClick={() => navigate('/manager/payments')}
              className="text-xs text-primary-400 hover:text-primary-300">Barchasi →</button>
          </div>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">To'lovlar yo'q</p>
          ) : (
            <div className="space-y-3">
              {payments.map(p => {
                const ps = PAY_STATUS[p.status] || PAY_STATUS.unpaid
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate">{p.firstName || "O'quvchi"}</p>
                      <p className="text-xs text-gray-500 truncate">{p.course_title || 'Kurs'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-green-400">{fmt(p.amount)} so'm</p>
                      <Badge color={ps.color}>{ps.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
